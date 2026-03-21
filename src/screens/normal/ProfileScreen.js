import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import {
  Button, Input, Card, Avatar, Badge, StarRating,
  Divider, LoadingSpinner, SectionHeader, ErrorBanner,
} from '../../components/common';
import {
  updateProfile, updateSkilledProfile, uploadAvatar,
} from '../../services/profileService';
import { getReviewsForSkilledUser } from '../../services/reviewService';
import { colors } from '../../theme/colors';
import { spacing, typography, radius } from '../../theme/index';

const ALL_SKILLS = [
  'Electrician', 'Plumber', 'Water Pump Repair', 'HVAC',
  'Carpentry', 'Welding', 'Painting', 'Tiling', 'Appliance Repair', 'General Handyman',
];

export function ProfileScreen({ navigation }) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const isSkilled  = profile?.role === 'skilled';
  const sp         = profile?.skilled_profiles;

  const [editing,   setEditing]   = useState(false);
  const [fullName,  setFullName]  = useState(profile?.full_name  || '');
  const [phone,     setPhone]     = useState(profile?.phone      || '');
  const [address,   setAddress]   = useState(profile?.address    || '');
  const [bio,       setBio]       = useState(sp?.bio             || '');
  const [skills,    setSkills]    = useState(sp?.skills          || []);
  const [reviews,   setReviews]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    if (isSkilled && user?.id) {
      getReviewsForSkilledUser(user.id).then(({ data }) => {
        if (data) setReviews(data);
      });
    }
  }, [isSkilled, user?.id]);

  const toggleSkill = (s) =>
    setSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, aspect: [1, 1], allowsEditing: true,
    });
    if (result.canceled) return;
    setLoading(true);
    const ext = result.assets[0].uri.split('.').pop() || 'jpg';
    const { url, error: uploadErr } = await uploadAvatar(user.id, result.assets[0].uri, ext);
    if (uploadErr) { Alert.alert('Upload failed', uploadErr.message); setLoading(false); return; }
    await updateProfile(user.id, { avatar_url: url });
    await refreshProfile();
    setLoading(false);
  };

  const handleSave = async () => {
    if (!fullName.trim()) { setError('Full name is required.'); return; }
    setLoading(true); setError('');
    await updateProfile(user.id, { full_name: fullName.trim(), phone: phone.trim(), address: address.trim() });
    if (isSkilled) {
      await updateSkilledProfile(user.id, { bio: bio.trim(), skills });
    }
    await refreshProfile();
    setEditing(false);
    setLoading(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  if (!profile) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}>

        {/* Avatar + Name */}
        <View style={styles.heroCard}>
          <TouchableOpacity onPress={editing ? pickAvatar : undefined}>
            <View>
              <Avatar uri={profile.avatar_url} name={profile.full_name} size={80} />
              {editing && (
                <View style={styles.editAvatarBadge}>
                  <Ionicons name="camera" size={14} color={colors.white} />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{profile.full_name}</Text>
            <Text style={styles.heroEmail}>{user?.email}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <Badge status={profile.role} />
              {isSkilled && sp?.rating > 0 && (
                <StarRating rating={sp.rating} size={14} count={sp.review_count} />
              )}
            </View>
          </View>
        </View>

        {/* Edit / Save buttons */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
          {!editing ? (
            <Button title="Edit Profile" onPress={() => setEditing(true)} variant="outline" icon="pencil-outline" style={{ flex: 1 }} />
          ) : (
            <>
              <Button title="Save" onPress={handleSave} loading={loading} style={{ flex: 1 }} />
              <Button title="Cancel" onPress={() => { setEditing(false); setError(''); }} variant="ghost" style={{ flex: 1 }} />
            </>
          )}
          <Button title="Sign Out" onPress={handleSignOut} variant="danger" icon="log-out-outline" size="md" />
        </View>

        <ErrorBanner message={error} />

        {/* Profile fields */}
        {editing ? (
          <Card>
            <Input label="Full Name"  value={fullName} onChangeText={setFullName} placeholder="Your full name"    icon="person-outline"   />
            <Input label="Phone"      value={phone}    onChangeText={setPhone}    placeholder="+370 600 12345"    icon="call-outline"     keyboardType="phone-pad" />
            <Input label="Address"    value={address}  onChangeText={setAddress}  placeholder="City, Country"     icon="location-outline" />
            {isSkilled && (
              <>
                <Input label="Bio" value={bio} onChangeText={setBio} placeholder="Tell clients about yourself..." multiline numberOfLines={3} icon="information-circle-outline" />
                <Text style={styles.label}>Skills</Text>
                <View style={styles.skillsGrid}>
                  {ALL_SKILLS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => toggleSkill(s)}
                      style={[styles.skillChip, skills.includes(s) && styles.skillChipActive]}
                    >
                      <Text style={[styles.skillText, skills.includes(s) && { color: colors.primary }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </Card>
        ) : (
          <Card>
            <InfoRow icon="call-outline"     label="Phone"   value={profile.phone   || 'Not set'} />
            <InfoRow icon="location-outline" label="Address" value={profile.address || 'Not set'} />
            {isSkilled && sp && (
              <>
                <Divider style={{ marginVertical: spacing.sm }} />
                {sp.bio && <InfoRow icon="information-circle-outline" label="Bio" value={sp.bio} />}
                {sp.skills?.length > 0 && (
                  <View>
                    <Text style={styles.label}>Skills</Text>
                    <View style={styles.skillsGrid}>
                      {sp.skills.map((s) => (
                        <View key={s} style={styles.skillBadge}>
                          <Text style={styles.skillBadgeText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </Card>
        )}

        {/* Reviews section (skilled only) */}
        {isSkilled && reviews.length > 0 && (
          <>
            <SectionHeader title={`Reviews (${reviews.length})`} />
            {reviews.map((r) => (
              <Card key={r.id} style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Avatar uri={r.reviewer?.avatar_url} name={r.reviewer?.full_name} size={32} />
                    <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{r.reviewer?.full_name}</Text>
                  </View>
                  <StarRating rating={r.rating} size={14} />
                </View>
                {r.review_text && <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 18 }}>{r.review_text}</Text>}
                <Text style={{ color: colors.textFaint, fontSize: 11, marginTop: 4 }}>{new Date(r.created_at).toLocaleDateString()}</Text>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm }}>
      <Ionicons name={icon} size={16} color={colors.textFaint} style={{ marginTop: 1, marginRight: 8, width: 18 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textFaint, fontSize: 11 }}>{label}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 1 }}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: colors.bg },
  heroCard:        { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  heroInfo:        { flex: 1, marginLeft: spacing.md },
  heroName:        { ...typography.h3, color: colors.textPrimary },
  heroEmail:       { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  editAvatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  label:           { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 8, marginTop: spacing.sm },
  skillsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip:       { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border },
  skillChipActive: { borderColor: colors.primary, backgroundColor: '#1F1800' },
  skillText:       { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  skillBadge:      { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full, backgroundColor: '#1A2240', borderWidth: 1, borderColor: '#4ECDC422' },
  skillBadgeText:  { color: colors.info, fontSize: 12, fontWeight: '600' },
});
