// features/chat/components/MessageInput.tsx
import { Feather } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  EMOJI_LIST,
  empName,
  MAX_MESSAGE_LENGTH,
  Message,
  msgText,
} from './chatTypes';
import { Colors } from './Colors';

interface MessageInputProps {
  replyTo: Message | null;
  onClearReply: () => void;
  draft: string;
  setDraft: (v: string) => void;
  onSend: () => void;
  onTyping: () => void;
  disabled?: boolean;
  onFileSelect?: (uri: string, name: string, type: string) => void;
  uploading?: boolean;
  uploadProgress?: number;
}

export default function MessageInput({
  replyTo,
  onClearReply,
  draft,
  setDraft,
  onSend,
  onTyping,
  disabled,
  onFileSelect,
  uploading,
  uploadProgress,
}: MessageInputProps) {
  const [showEmoji, setShowEmoji] = useState(false);
  const textRef = useRef<TextInput>(null);

  const charsLeft = MAX_MESSAGE_LENGTH - draft.length;
  const overLimit = charsLeft < 0;
  const canSend = !disabled && !uploading && !overLimit && !!draft.trim();

  const handlePickImage = async () => {
    console.log('Install expo-image-picker to enable file attachments');
  };

  return (
    <View style={styles.container}>
      {replyTo && (
        <View style={styles.replyBar}>
          <Feather name="corner-up-left" size={14} color={Colors.primary} />
          <View style={styles.replyContent}>
            <Text style={styles.replyName}>
              Replying to {empName(replyTo.sender)}
            </Text>
            <Text style={styles.replyPreview} numberOfLines={1}>
              {replyTo.message_type !== 'text'
                ? `📎 ${replyTo.message_type}`
                : msgText(replyTo)}
            </Text>
          </View>
          <TouchableOpacity onPress={onClearReply} style={styles.replyClose}>
            <Feather name="x" size={14} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {uploading && (
        <View style={styles.uploadBar}>
          <Text style={styles.uploadText}>
            Uploading… {uploadProgress ?? 0}%
          </Text>
          <View style={styles.uploadTrack}>
            <View
              style={[
                styles.uploadFill,
                { width: `${uploadProgress || 0}%` as `${number}%` },
              ]}
            />
          </View>
        </View>
      )}

      {showEmoji && (
        <View style={styles.emojiPicker}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.emojiGrid}>
              {EMOJI_LIST.map((e, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.emojiBtn}
                  onPress={() => {
                    setDraft(draft + e);
                    textRef.current?.focus();
                  }}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={() => setShowEmoji(false)}
            style={styles.emojiClose}
          >
            <Feather name="x" size={14} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputRow}>
        <TouchableOpacity
          onPress={() => setShowEmoji((v) => !v)}
          style={styles.iconBtn}
          disabled={disabled}
        >
          <Feather
            name="smile"
            size={22}
            color={showEmoji ? Colors.primary : Colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePickImage}
          style={styles.iconBtn}
          disabled={disabled || uploading}
        >
          <Feather name="paperclip" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View
          style={[
            styles.inputWrap,
            overLimit && styles.inputWrapError,
            { borderRadius: 22 },
          ]}
        >
          <TextInput
            ref={textRef}
            value={draft}
            onChangeText={(v) => {
              if (v.length <= MAX_MESSAGE_LENGTH + 50) {
                setDraft(v);
                onTyping();
              }
            }}
            placeholder={
              disabled
                ? 'Select a conversation…'
                : uploading
                  ? 'Uploading…'
                  : 'Type a message…'
            }
            placeholderTextColor={Colors.textLight}
            multiline
            maxLength={MAX_MESSAGE_LENGTH + 50}
            editable={!disabled && !uploading}
            style={styles.input}
            returnKeyType="default"
            textAlignVertical="center"
          />

          {draft.length > MAX_MESSAGE_LENGTH * 0.8 && (
            <Text style={[styles.charCount, overLimit && styles.charCountOver]}>
              {draft.length}/{MAX_MESSAGE_LENGTH}
            </Text>
          )}
        </View>

        {canSend ? (
          <TouchableOpacity onPress={onSend} style={styles.sendBtn}>
            <Feather name="send" size={20} color={Colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.micBtn}
            disabled={disabled || uploading}
          >
            <Feather name="mic" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 30,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.primarySurface,
    borderTopWidth: 1,
    borderTopColor: Colors.primaryBorder,
  },
  replyContent: {
    flex: 1,
    minWidth: 0,
  },
  replyName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  replyPreview: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  replyClose: {
    padding: 4,
  },
  uploadBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.primarySurface,
  },
  uploadText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  uploadTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  uploadFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  emojiPicker: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiGrid: {
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 8,
  },
  emojiBtn: {
    padding: 6,
  },
  emojiText: {
    fontSize: 22,
  },
  emojiClose: {
    padding: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  iconBtn: {
    padding: 8,
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  inputWrap: {
    flex: 1,
    // backgroundColor: Colors.inputBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: 'center',
  },
  inputWrapError: {
    borderColor: Colors.error,
  },
  input: {
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
    padding: 0,
    margin: 0,
  },
  charCount: {
    fontSize: 10,
    color: Colors.textLight,
    textAlign: 'right',
    marginTop: 2,
  },
  charCountOver: {
    color: Colors.error,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.inputBg,
  },
});