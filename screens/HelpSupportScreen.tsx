import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '../components/ScreenHeader';
import { colors, radius, spacing, typography } from '../lib/theme';
import { useTranslation } from '../lib/i18n';

type ChatMessage = {
id: string;
role: 'user' | 'assistant';
text: string;
createdAt: number;
};

async function askTranspoAI(language: 'en' | 'fr', userText: string): Promise<string> {
// We intentionally keep this lightweight and safe.
// If this endpoint is unavailable, the UI falls back to a generic response.
const resp = await fetch('https://api.a0.dev/ai/llm', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
messages: [
{
role: 'system',
content:
language === 'fr'
? "Tu es l'assistant support TransPo. Réponds brièvement et clairement. Si tu ne sais pas, propose de contacter le support."
: 'You are TransPo support assistant. Respond briefly and clearly. If unsure, suggest contacting support.',
},
{ role: 'user', content: userText },
],
}),
});

const json = await resp.json();
const content = (json?.completion ?? '').toString().trim();
if (!content) throw new Error('Empty AI response');
return content;
}

export default function HelpSupportScreen({ navigation }: any) {
const { t, language } = useTranslation();

const [messages, setMessages] = useState<ChatMessage[]>(() => [
{
id: 'm0',
role: 'assistant',
text: t.settings.helpWelcome,
createdAt: Date.now(),
},
]);
const [input, setInput] = useState('');
const [isThinking, setIsThinking] = useState(false);

const canSend = input.trim().length > 0 && !isThinking;

const contactSupportHint = useMemo(() => t.settings.helpEscalationHint, [t]);

const send = async () => {
const text = input.trim();
if (!text) return;

const userMessage: ChatMessage = {
id: `u_${Date.now()}`,
role: 'user',
text,
createdAt: Date.now(),
};

setMessages((m) => [userMessage, ...m]);
setInput('');
setIsThinking(true);

try {
const answer = await askTranspoAI(language, text);
const assistantMessage: ChatMessage = {
id: `a_${Date.now()}`,
role: 'assistant',
text: answer,
createdAt: Date.now(),
};
setMessages((m) => [assistantMessage, ...m]);
} catch {
const assistantMessage: ChatMessage = {
id: `a_${Date.now()}`,
role: 'assistant',
text: contactSupportHint,
createdAt: Date.now(),
};
setMessages((m) => [assistantMessage, ...m]);
} finally {
setIsThinking(false);
}
};

const renderItem = ({ item }: { item: ChatMessage }) => {
const isUser = item.role === 'user';
return (
<View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
<Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
{item.text}
</Text>
</View>
);
};

return (
<SafeAreaView style={styles.container} edges={['bottom']}>
<ScreenHeader title={t.settings.help} onBack={() => navigation.goBack()} />

<KeyboardAvoidingView
style={styles.flex}
behavior={Platform.OS === 'ios' ? 'padding' : undefined}
keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
>
<FlatList
inverted
data={messages}
keyExtractor={(m) => m.id}
renderItem={renderItem}
contentContainerStyle={styles.listContent}
/>

<View style={styles.composer}>
<View style={styles.inputWrap}>
<TextInput
value={input}
onChangeText={setInput}
placeholder={t.settings.helpPlaceholder}
placeholderTextColor={colors.onSurfaceVariant}
style={styles.input}
multiline
/>
</View>

<TouchableOpacity
activeOpacity={0.85}
disabled={!canSend}
onPress={send}
style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
>
{isThinking ? (
<ActivityIndicator color={colors.onPrimary} />
) : (
<FontAwesome5 name="paper-plane" size={16} color={colors.onPrimary} />
)}
</TouchableOpacity>
</View>
</KeyboardAvoidingView>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
flex: { flex: 1 },
container: { flex: 1, backgroundColor: colors.background },
listContent: {
paddingHorizontal: spacing.lg,
paddingTop: spacing.lg,
paddingBottom: spacing.md,
gap: spacing.sm,
},
bubble: {
maxWidth: '88%',
borderRadius: radius.xl,
paddingHorizontal: spacing.lg,
paddingVertical: spacing.md,
borderWidth: 1,
},
bubbleUser: {
alignSelf: 'flex-end',
backgroundColor: colors.primary,
borderColor: colors.primary,
},
bubbleAssistant: {
alignSelf: 'flex-start',
backgroundColor: colors.surface,
borderColor: colors.outlineVariant,
},
bubbleText: {
fontSize: typography.body2.fontSize,
lineHeight: 20,
},
bubbleTextUser: { color: colors.onPrimary, fontWeight: '700' },
bubbleTextAssistant: { color: colors.onSurface, fontWeight: '600' },
composer: {
padding: spacing.lg,
flexDirection: 'row',
alignItems: 'flex-end',
gap: spacing.md,
borderTopWidth: 1,
borderTopColor: colors.outlineVariant,
backgroundColor: colors.background,
},
inputWrap: {
flex: 1,
borderWidth: 1,
borderColor: colors.outlineVariant,
borderRadius: radius.xl,
backgroundColor: colors.surface,
paddingHorizontal: spacing.md,
paddingVertical: spacing.sm,
minHeight: 44,
maxHeight: 120,
},
input: {
fontSize: typography.body2.fontSize,
color: colors.onSurface,
},
sendButton: {
width: 48,
height: 48,
borderRadius: radius.xl,
backgroundColor: colors.primary,
alignItems: 'center',
justifyContent: 'center',
},
sendButtonDisabled: { opacity: 0.5 },
});
