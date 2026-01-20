import { Alert } from 'react-native';

// Local, best-effort user notification helper.
//
// Why this exists:
// - A production-grade "driver arrived" push notification requires:
//   1) device push tokens, 2) Expo push service (or APNs/FCM), 3) background send from Convex actions.
// - For now (testing + in-app experience), we show an in-app alert and *attempt* a local notification
//   if expo-notifications is available in the project.
//
// This file is intentionally defensive: it will never crash the app if notifications aren't configured.

type LocalNotificationParams = {
title: string;
body: string;
};

export async function notifyUserLocal({ title, body }: LocalNotificationParams) {
// Always show an in-app alert so the user gets immediate feedback.
// This also works even if notification permissions aren't granted.
try {
Alert.alert(title, body);
} catch {
// Ignore.
}

// Best-effort local notification (works if expo-notifications is installed + permissions granted).
// We use a dynamic require so bundling won't fail if the module isn't present.
try {
// eslint-disable-next-line @typescript-eslint/no-var-requires
const moduleName = 'expo-notifications';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Notifications = require(moduleName);

if (!Notifications?.requestPermissionsAsync || !Notifications?.scheduleNotificationAsync) {
return;
}

const permissions = await Notifications.getPermissionsAsync?.();
const hasPermission = permissions?.granted === true;

if (!hasPermission) {
const request = await Notifications.requestPermissionsAsync();
if (request?.granted !== true) return;
}

await Notifications.scheduleNotificationAsync({
content: { title, body },
trigger: null,
});
} catch {
// If expo-notifications isn't installed or can't be used, silently ignore.
}
}
