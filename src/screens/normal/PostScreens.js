import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../context/LanguageContext";
import PostCard from "../../components/posts/PostCard";
import OfferCard from "../../components/offers/OfferCard";
import {
  Button,
  Input,
  Card,
  Badge,
  Avatar,
  LoadingSpinner,
  EmptyState,
  SectionHeader,
  Divider,
  ErrorBanner,
} from "../../components/common";
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  uploadPostImage,
} from "../../services/postService";
import {
  getOffersForPost,
  createOffer,
  updateOffer,
  deleteOffer,
} from "../../services/offerService";
import { getOrCreateChat } from "../../services/chatService";
import {
  createOrder,
  getActiveOrderForPost,
} from "../../services/orderService";
import { colors } from "../../theme/colors";
import { spacing, typography, radius } from "../../theme/index";

// ─────────────────────────────────────────────────────────────────────────────
// PostsListScreen — browse all posts (normal + skilled share this)
// ─────────────────────────────────────────────────────────────────────────────
export function PostsListScreen({ navigation }) {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const { data } = await getPosts();
    if (data) setPosts(data); // Ensure completed posts are not shown
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  console.log("PostsListScreen loaded posts with statuses:", posts);

  // Reload posts whenever this screen comes into focus (e.g., after completing an order)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  

  const filtered = posts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });
  console.log("PostsListScreen filtered posts count:", filtered.length);

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons
          name="search-outline"
          size={18}
          color={colors.textFaint}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={t("posts.searchPlaceholder")}
          placeholderTextColor={colors.textFaint}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() =>
              navigation.navigate("PostDetail", { postId: item.id })
            }
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="construct-outline"
            title={t("posts.noJobsTitle")}
            subtitle={t("posts.noJobsSubtitle")}
          />
        }
      />

      {profile?.role === "normal" && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("CreatePost")}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PostDetailScreen — full post + offers list
// ─────────────────────────────────────────────────────────────────────────────
export function PostDetailScreen({ route, navigation }) {
  const { postId } = route.params;
  const { user, profile } = useAuth();
  const { t } = useTranslation();

  const [post, setPost] = useState(null);
  const [offers, setOffers] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offerForm, setOfferForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [offerDesc, setOfferDesc] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isOwner = post?.user_id === user?.id;
  const isSkilled = profile?.role === "skilled";

  const load = useCallback(async () => {
    const [{ data: p }, { data: o }] = await Promise.all([
      getPost(postId),
      getOffersForPost(postId),
    ]).catch((err) => {
      console.error("Error loading post details:", err);
    });

    console.log("Loaded offers:", o);
    if (p) setPost(p);
    if (o) setOffers(o);

    if (profile?.role === "normal" && p) {
      const { data: ord } = await getActiveOrderForPost(postId, user.id);
      setActiveOrder(ord);
    }
    setLoading(false);
  }, [postId, user?.id, profile?.role]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Offer submit ────────────────────────────────────────────────────────
  const handleOfferSubmit = async () => {
    if (!offerDesc || !offerPrice) {
      setError(t("posts.fillDescAndPrice"), console.log());
      return;
    }
    setSaving(true);
    setError("");
    if (editingOffer) {
      await updateOffer(editingOffer.id, {
        description: offerDesc,
        price: parseFloat(offerPrice),
      });
    } else {
      try {
        console.log("Creating offer with:", {
          postId,
          skilledUserId: user.id,
          description: offerDesc,
          price: parseFloat(offerPrice),
        });
        await createOffer({
          postId,
          skilledUserId: user.id,
          description: offerDesc,
          price: parseFloat(offerPrice),
        });
      } catch (error) {
        console.error("Error creating offer:", error);
      }
    }
    setOfferForm(false);
    setEditingOffer(null);
    setOfferDesc("");
    setOfferPrice("");
    setSaving(false);
    load();
  };

  const openEditOffer = (offer) => {
    setEditingOffer(offer);
    setOfferDesc(offer.description);
    setOfferPrice(String(offer.price));
    setOfferForm(true);
  };

  const handleDeleteOffer = (offer) => {
    Alert.alert(t("posts.deleteOfferTitle"), t("posts.deleteOfferConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          await deleteOffer(offer.id);
          load();
        },
      },
    ]);
  };

  // ── Start chat ──────────────────────────────────────────────────────────
  const handleStartChat = async (offer) => {
    const { data: chat } = await getOrCreateChat(
      user.id,
      offer.skilled_user_id,
      postId,
    );
    if (chat)
      navigation.navigate("ChatDetail", {
        chatId: chat.id,
        otherName: offer.skilled_user?.full_name,
      });
  };

  // ── Order ───────────────────────────────────────────────────────────────
  const handleOrder = (offer) => {
    navigation.navigate("CreateOrder", { offer, post });
  };

  // ── Delete post ─────────────────────────────────────────────────────────
  const handleDeletePost = () => {
    Alert.alert(t("posts.deletePostTitle"), t("posts.deletePostConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          await deletePost(postId);
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading || !post) return <LoadingSpinner />;

  // check if skilled user already has an offer on this post
  const myExistingOffer = isSkilled
    ? offers.find((o) => o.skilled_user_id === user.id)
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Post image */}
        {post.image_url && (
          <Image source={{ uri: post.image_url }} style={styles.postImage} />
        )}

        <View style={{ padding: spacing.md }}>
          {/* Title + status */}
          <View style={styles.titleRow}>
            <Text style={styles.postTitle}>{post.title}</Text>
            <Badge status={post.status} />
          </View>

          {/* Owner info + date */}
          <View style={styles.ownerRow}>
            <Avatar
              uri={post.profiles?.avatar_url}
              name={post.profiles?.full_name}
              size={32}
            />
            <Text style={styles.ownerName}>{post.profiles?.full_name}</Text>
            <Text style={styles.postDate}>
              {new Date(post.created_at).toLocaleDateString()}
            </Text>
          </View>

          <Text style={styles.postBody}>{post.description}</Text>

          {/* Owner actions */}
          {isOwner && post.status === "open" && (
            <View style={styles.ownerActions}>
              <Button
                title={t("common.edit")}
                onPress={() => navigation.navigate("CreatePost", { post })}
                variant="outline"
                size="sm"
                icon="pencil-outline"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={t("common.delete")}
                onPress={handleDeletePost}
                variant="danger"
                size="sm"
                icon="trash-outline"
                style={{ flex: 1 }}
              />
            </View>
          )}

          <Divider />

          {/* Offers section */}
          <SectionHeader
            title={t("posts.offersHeading", { count: offers.length })}
          />

          {/* Skilled user: offer form */}
          {isSkilled &&
            post.status === "open" &&
            !myExistingOffer &&
            !offerForm && (
              <Button
                title={t("posts.makeOffer")}
                onPress={() => setOfferForm(true)}
                icon="add-circle-outline"
                style={{ marginBottom: spacing.md }}
              />
            )}

          {isSkilled && offerForm && (
            <Card style={{ borderColor: colors.primary + "44" }}>
              <Text style={styles.formTitle}>
                {editingOffer ? t("posts.editOffer") : t("posts.newOffer")}
              </Text>
              <ErrorBanner message={error} />
              <Input
                label={t("posts.offerDescLabel")}
                placeholder={t("posts.offerDescPlaceholder")}
                value={offerDesc}
                onChangeText={setOfferDesc}
                multiline
                numberOfLines={3}
              />
              <Input
                label={t("posts.priceLabel")}
                placeholder={t("posts.pricePlaceholder")}
                value={offerPrice}
                onChangeText={setOfferPrice}
                keyboardType="numeric"
              />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Button
                  title={editingOffer ? t("common.update") : t("common.submit")}
                  onPress={handleOfferSubmit}
                  loading={saving}
                  style={{ flex: 1 }}
                />
                <Button
                  title={t("common.cancel")}
                  onPress={() => {
                    setOfferForm(false);
                    setEditingOffer(null);
                    setOfferDesc("");
                    setOfferPrice("");
                  }}
                  variant="ghost"
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          )}

          {offers.length === 0 ? (
            <EmptyState
              icon="chatbubble-outline"
              title={t("posts.noOffersTitle")}
              subtitle={
                isSkilled
                  ? t("posts.noOffersSubSkilled")
                  : t("posts.noOffersSubOwner")
              }
            />
          ) : (
            offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                isPostOwner={isOwner}
                hasActiveOrder={!!activeOrder}
                currentUserId={user.id}
                onOrder={handleOrder}
                onStartChat={handleStartChat}
                onEdit={openEditOffer}
                onDelete={handleDeleteOffer}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CreatePostScreen — create or edit a post
// ─────────────────────────────────────────────────────────────────────────────
export function CreatePostScreen({ route, navigation }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const editPost = route.params?.post;
  const [title, setTitle] = useState(editPost?.title || "");
  const [desc, setDesc] = useState(editPost?.description || "");
  const [imageUri, setImageUri] = useState(editPost?.image_url || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !desc.trim()) {
      setError(t("posts.titleDescRequired"));
      return;
    }
    setLoading(true);
    setError("");

    let imageUrl = editPost?.image_url || null;
    if (imageUri && imageUri !== editPost?.image_url) {
      const ext = imageUri.split(".").pop() || "jpg";
      const { url, error: uploadErr } = await uploadPostImage(
        user.id,
        imageUri,
        ext,
      );
      if (uploadErr) {
        setError(
          t("posts.imageUploadFailed", {
            error: uploadErr.message || JSON.stringify(uploadErr),
          }),
        );
        setLoading(false);
        return;
      }
      imageUrl = url;
    }

    if (editPost) {
      await updatePost(editPost.id, {
        title: title.trim(),
        description: desc.trim(),
        image_url: imageUrl,
      });
    } else {
      await createPost({
        userId: user.id,
        title: title.trim(),
        description: desc.trim(),
        imageUrl,
      });
    }
    setLoading(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.screenTitle}>
          {editPost ? t("posts.editJobPost") : t("posts.postNewJob")}
        </Text>

        <ErrorBanner message={error} />

        <Input
          label={t("posts.jobTitle")}
          placeholder={t("posts.jobTitlePlaceholder")}
          value={title}
          onChangeText={setTitle}
          icon="construct-outline"
        />
        <Input
          label={t("posts.description")}
          placeholder={t("posts.descPlaceholder")}
          value={desc}
          onChangeText={setDesc}
          multiline
          numberOfLines={5}
        />

        {/* Image picker */}
        <Text style={inputLabelStyle}>{t("posts.photoOptional")}</Text>
        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.imagePickerPlaceholder}>
              <Ionicons
                name="camera-outline"
                size={32}
                color={colors.textFaint}
              />
              <Text style={{ color: colors.textFaint, marginTop: 6 }}>
                {t("posts.tapToAddPhoto")}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Button
          title={editPost ? t("common.saveChanges") : t("posts.postJob")}
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          style={{ marginTop: spacing.md }}
          icon="checkmark-outline"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const inputLabelStyle = {
  fontSize: 13,
  fontWeight: "600",
  color: colors.textMuted,
  marginBottom: 6,
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md, paddingBottom: 80 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    margin: spacing.md,
    backgroundColor: colors.bgInput,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.textSecondary,
    paddingVertical: 11,
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  postImage: { width: "100%", height: 200, resizeMode: "cover" },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  postTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.md,
  },
  ownerName: { color: colors.textMuted, fontSize: 13, flex: 1 },
  postDate: { color: colors.textFaint, fontSize: 12 },
  postBody: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  ownerActions: { flexDirection: "row", marginTop: spacing.md },
  formTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  screenTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  imagePicker: {
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    marginBottom: spacing.md,
  },
  imagePickerPlaceholder: {
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgInput,
  },
  previewImage: { width: "100%", height: 180, resizeMode: "cover" },
});
