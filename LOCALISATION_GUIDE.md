# FixBook Localisation Guide

A complete explanation of how the multi-language system works in this app — from files on disk to what the user sees on screen.

---

## Table of Contents

1. [Overview](#1-overview)
2. [File Structure](#2-file-structure)
3. [The Translation Files (en.js / lt.js)](#3-the-translation-files-enjs--ltjs)
4. [The i18n Setup (i18n.js)](#4-the-i18n-setup-i18njs)
5. [The Language Context (LanguageContext.js)](#5-the-language-context-languagecontextjs)
6. [How Screens Use Translations](#6-how-screens-use-translations)
7. [Dynamic Values in Translations (Interpolation)](#7-dynamic-values-in-translations-interpolation)
8. [The Language Switcher (Profile Screen)](#8-the-language-switcher-profile-screen)
9. [How Language is Saved and Restored](#9-how-language-is-saved-and-restored)
10. [Auto-Detection of Device Language](#10-auto-detection-of-device-language)
11. [Translation Key Reference](#11-translation-key-reference)
12. [Adding a New Language](#12-adding-a-new-language)
13. [Adding a New Translation Key](#13-adding-a-new-translation-key)

---

## 1. Overview

FixBook supports two languages:

| Code | Language  |
|------|-----------|
| `en` | English   |
| `lt` | Lithuanian (Lietuvių) |

The language is chosen automatically from the device locale on first launch. After that, the user can switch it manually in the Profile screen. The choice is saved to device storage so it persists across app restarts.

The library used is **i18n-js** (installed as an npm package). It reads a locale code like `"en"` or `"lt"` and looks up the matching string from the translation objects.

---

## 2. File Structure

```
src/
├── locales/
│   ├── en.js              ← All English strings
│   ├── lt.js              ← All Lithuanian strings
│   └── i18n.js            ← Sets up the i18n-js library, exposes t(), setLocale(), detectDeviceLanguage()
└── context/
    └── LanguageContext.js ← React context that holds the current language and provides t() to all screens
```

These four files are the entire localisation system. Nothing else needs to be touched.

---

## 3. The Translation Files (en.js / lt.js)

Each file exports a single JavaScript object. The object is grouped into **sections** — one per feature area of the app. Every key in the English file has an exact matching key in the Lithuanian file.

```js
// en.js (example)
export default {
  common: {
    cancel: 'Cancel',
    loading: 'Loading...',
  },
  auth: {
    signIn: 'Sign In',
  },
};

// lt.js (example)
export default {
  common: {
    cancel: 'Atšaukti',
    loading: 'Kraunama...',
  },
  auth: {
    signIn: 'Prisijungti',
  },
};
```

**Sections and what they cover:**

| Section       | What it translates |
|---------------|--------------------|
| `common`      | Shared words used everywhere: Cancel, OK, Save, Delete, Loading, time labels |
| `badge`       | Status labels shown on cards: OPEN, PENDING, ACCEPTED, SKILLED PRO, etc. |
| `auth`        | Login and register screens: labels, placeholders, error messages |
| `nav`         | Tab bar labels and screen titles |
| `posts`       | Job listing screens: search, create, edit, offer submission |
| `offers`      | Offer card action buttons: Order, Chat |
| `orders`      | Orders list screen: tabs, confirm dialogs, action buttons, detail labels |
| `createOrder` | Create Order screen: form labels, validation errors, success message |
| `review`      | Leave a Review screen: labels, star rating words, success message |
| `chat`        | Chat list and chat detail screens |
| `profile`     | Profile screen: edit form, sign out, skills list, language picker |
| `admin`       | Admin dashboard and management screens |

---

## 4. The i18n Setup (i18n.js)

**File:** `src/locales/i18n.js`

This file wires up the i18n-js library with the two translation objects and exports helper functions used by the rest of the app.

```js
import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import en from './en';
import lt from './lt';

// 1. Create the i18n instance and register both languages
export const i18n = new I18n({ en, lt });

// 2. If a key is missing in the current language, fall back to English
i18n.enableFallback = true;
i18n.defaultLocale  = 'en';

// 3. Detect the device's language code (returns 'en' or 'lt', defaults to 'en')
export function detectDeviceLanguage() {
  const locales = Localization.getLocales?.() || [];
  const code    = locales[0]?.languageCode?.toLowerCase();
  return SUPPORTED_LANGUAGES.some((l) => l.code === code) ? code : 'en';
}

// 4. Change the active language
export function setLocale(code) {
  i18n.locale = code;
}

// 5. Translate a key — used directly by LanguageContext
export function t(key, options) {
  return i18n.t(key, options);
}
```

**Key behaviours:**

- `enableFallback = true` — if a key exists in English but is missing from Lithuanian, the English text is shown instead of an error. This is a safety net.
- `defaultLocale = 'en'` — English is the base language.
- `SUPPORTED_LANGUAGES` — the array of `{ code, label }` objects used to populate the language picker in Profile.

---

## 5. The Language Context (LanguageContext.js)

**File:** `src/context/LanguageContext.js`

This is a React context that wraps the entire app. It holds the current language code in state and provides a `t()` function and `changeLanguage()` function to every screen.

```js
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en'); // current language code
  const [ready,    setReady]    = useState(false); // true once async init is done

  // On first mount: load saved language from AsyncStorage, or detect device language
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('@fixbook:language');
      const code  = saved || detectDeviceLanguage();
      setLocale(code);    // tell i18n-js to use this language
      setLanguage(code);  // update React state so components re-render
      setReady(true);
    })();
  }, []);

  // Called when user picks a different language in Profile
  const changeLanguage = async (code) => {
    setLocale(code);
    setLanguage(code);
    await AsyncStorage.setItem('@fixbook:language', code); // persist the choice
  };

  // t() is a wrapper around i18n.t — depends on `language` state so React
  // knows to re-render all components when the language changes
  const t = useCallback((key, options) => i18n.t(key, options), [language]);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, supported: SUPPORTED_LANGUAGES, ready }}>
      {children}
    </LanguageContext.Provider>
  );
}
```

**What `ready` is for:**

The language is loaded from AsyncStorage asynchronously. Until it finishes, `ready` is `false`. The app can use this flag to show a loading screen and avoid a flash where English text appears briefly before switching to Lithuanian.

**The hook:**

```js
export const useTranslation = () => useContext(LanguageContext);
```

Any screen imports `useTranslation` and calls it to get `t`, `language`, `changeLanguage`, and `supported`.

---

## 6. How Screens Use Translations

Every screen that needs translated text follows the same pattern:

```js
import { useTranslation } from '../../context/LanguageContext';

export function MyScreen() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('orders.tabActive')}</Text>
      <Button title={t('common.save')} />
    </View>
  );
}
```

`t('section.key')` looks up the dot-separated key in the current language's translation object and returns the string. If the language is English it returns the English string; if Lithuanian it returns the Lithuanian string.

---

## 7. Dynamic Values in Translations (Interpolation)

Some strings contain a variable value — for example a count or a name. These use the `{{variableName}}` placeholder syntax.

**In the translation file:**

```js
// en.js
offersCountOther: '{{n}} offers',
deleteUserConfirm: 'Delete "{{name}}"? This will remove all their data.',
reviewsHeading: 'Reviews ({{count}})',
```

**In the screen:**

```js
t('posts.offersCountOther', { n: 5 })
// → "5 offers"

t('admin.deleteUserConfirm', { name: 'John' })
// → 'Delete "John"? This will remove all their data.'

t('profile.reviewsHeading', { count: 12 })
// → "Reviews (12)"
```

The second argument to `t()` is an object whose keys match the `{{placeholder}}` names in the string. i18n-js replaces each placeholder with the provided value.

---

## 8. The Language Switcher (Profile Screen)

The Profile screen reads `language`, `changeLanguage`, and `supported` from the context:

```js
const { language, changeLanguage, supported } = useTranslation();
```

- `supported` is the array `[{ code: 'en', label: 'English' }, { code: 'lt', label: 'Lietuvių' }]`
- The screen renders a button or picker for each item in `supported`
- When the user taps one, it calls `changeLanguage('lt')` (or `'en'`)
- That updates the i18n-js locale AND saves the choice to AsyncStorage AND triggers a React re-render
- Because `t()` in the context depends on `[language]` state, every component that called `useTranslation()` re-renders and all text updates immediately — no reload needed

---

## 9. How Language is Saved and Restored

The key used in AsyncStorage is `@fixbook:language`.

**On app launch:**

1. `LanguageProvider` mounts
2. It reads `@fixbook:language` from AsyncStorage
3. If a value exists (e.g. `"lt"`), it uses that
4. If no value exists (first launch), it calls `detectDeviceLanguage()`
5. It calls `setLocale(code)` to tell i18n-js, and `setLanguage(code)` to trigger re-render

**On language change:**

1. User taps a language in Profile
2. `changeLanguage('lt')` is called
3. i18n-js locale is updated immediately → all `t()` calls return Lithuanian
4. React state `language` is updated → all components re-render
5. `AsyncStorage.setItem('@fixbook:language', 'lt')` persists the choice for next launch

---

## 10. Auto-Detection of Device Language

The function `detectDeviceLanguage()` in `i18n.js` reads the device's locale using `expo-localization`:

```js
function detectDeviceLanguage() {
  const locales = Localization.getLocales?.() || [];
  const code    = locales[0]?.languageCode?.toLowerCase(); // e.g. "lt", "en", "de"
  return SUPPORTED_LANGUAGES.some((l) => l.code === code) ? code : 'en';
}
```

- If the device is set to Lithuanian → the app opens in Lithuanian automatically
- If the device is set to German, French, Arabic, etc. → falls back to English (not supported)
- Only runs on first launch; after that the saved preference takes over

---

## 11. Translation Key Reference

Full list of every section and key available:

### `common`
`cancel` `ok` `yes` `no` `save` `saveChanges` `delete` `edit` `submit` `update` `confirm` `loading` `notSet` `error` `unknownError` `fillAllFields` `justNow` `minutesAgo` `hoursAgo` `daysAgo`

### `badge`
`open` `in_progress` `completed` `cancelled` `pending` `accepted` `declined` `ordered` `normal` `skilled` `admin`

### `auth`
`tagline` `createAccount` `email` `emailPlaceholder` `password` `passwordHidden` `confirmPassword` `repeatPassword` `fullName` `yourFullName` `min6Chars` `signIn` `register` `signUp` `noAccountQ` `haveAccountQ` `iAmA` `homeowner` `homeownerSub` `skilledPro` `skilledProSub` `passwordsMismatch` `passwordTooShort`

### `nav`
`jobs` `jobBoard` `orders` `myOrders` `chats` `chat` `profile` `browse` `findJobs` `dashboard` `manageUsers` `managePosts` `manageOrders` `manageReviews` `jobDetails` `postAJob` `editPost` `confirmOrder` `leaveAReview` `orderDetail`

### `posts`
`searchPlaceholder` `noJobsTitle` `noJobsSubtitle` `offersCountOne` `offersCountOther` `editJobPost` `postNewJob` `jobTitle` `jobTitlePlaceholder` `description` `descPlaceholder` `photoOptional` `tapToAddPhoto` `postJob` `titleDescRequired` `imageUploadFailed` `offersHeading` `makeOffer` `editOffer` `newOffer` `offerDescLabel` `offerDescPlaceholder` `priceLabel` `pricePlaceholder` `fillDescAndPrice` `noOffersTitle` `noOffersSubSkilled` `noOffersSubOwner` `deleteOfferTitle` `deleteOfferConfirm` `deletePostTitle` `deletePostConfirm`

### `offers`
`order` `chat`

### `orders`
`tabActive` `tabHistory` `noActiveTitle` `noHistoryTitle` `activeSubSkilled` `activeSubNormal` `historySub` `confirmTitle` `acceptConfirm` `declineConfirm` `completeConfirm` `couldNotUpdate` `accept` `decline` `markCompleted` `leaveReview` `reviewSubmitted` `detailDate` `detailTime` `detailPhone` `detailLocation` `detailPrice`

### `createOrder`
`title` `agreedPrice` `scheduledDate` `scheduledTime` `contactPhone` `phonePlaceholder` `jobLocation` `locationPlaceholder` `submit` `phoneLocationReq` `futureDate` `duplicateOrder` `placedTitle` `placedBody` `viewMyOrders`

### `review`
`title` `rating` `poor` `fair` `good` `veryGood` `excellent` `writtenLabel` `writtenPlaceholder` `submit` `duplicate` `submittedTitle` `submittedBody`

### `chat`
`noConversationsTitle` `noConversationsSubtitle` `noMessages` `typeMessage` `rePrefix`

### `profile`
`editProfile` `signOut` `signOutConfirm` `fullName` `phone` `address` `addressPlaceholder` `bio` `bioPlaceholder` `skills` `fullNameRequired` `uploadFailed` `reviewsHeading` `language` `skillsList.*`

### `admin`
`dashboard` `statTotalUsers` `statSkilled` `statHomeowners` `statOpenJobs` `statActiveOrders` `statReviews` `management` `manageUsers` `managePosts` `manageOrders` `manageReviews` `deleteUser` `deleteUserConfirm` `deletePost` `deletePostConfirm` `deleteOrder` `deleteOrderConfirm` `deleteReview` `deleteReviewConfirm` `noPhone` `byUserOffers` `noUsers` `noPosts` `noOrders` `noReviews` `thisWeek` `postsByStatus` `ordersByStatus` `avgRating` `recentActivity` `activityOrder` `activityReview` `filterAll` `filterNormal` `filterSkilled` `searchUsers` `changeStatus`

---

## 12. Adding a New Language

Example: adding Arabic (`ar`).

**Step 1 — Create the translation file**

Copy `en.js` to `ar.js` and translate every string value. Do not change any keys.

```
src/locales/ar.js
```

**Step 2 — Register it in i18n.js**

```js
import ar from './ar';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'lt', label: 'Lietuvių' },
  { code: 'ar', label: 'العربية' },   // ← add this
];

export const i18n = new I18n({ en, lt, ar });  // ← add ar here
```

That is all. The language picker in Profile will automatically show the new option because it reads from `SUPPORTED_LANGUAGES`. Auto-detection will also work: if a user's device is set to Arabic, the app opens in Arabic.

---

## 13. Adding a New Translation Key

Example: you add a new screen that needs a title "Notifications".

**Step 1 — Add the key to en.js**

Pick the right section or create a new one:

```js
// en.js
nav: {
  // ... existing keys ...
  notifications: 'Notifications',   // ← add
},
```

**Step 2 — Add the same key to lt.js**

```js
// lt.js
nav: {
  // ... existing keys ...
  notifications: 'Pranešimai',   // ← add the Lithuanian translation
},
```

**Step 3 — Use it in your screen**

```js
const { t } = useTranslation();
<Text>{t('nav.notifications')}</Text>
```

**Rule:** every key added to `en.js` must be added to `lt.js` (and any other language files) at the same time, or the fallback will silently show English in the other languages.
