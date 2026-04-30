// features/chat/components/ChatTopBar.tsx
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  SafeAreaView, StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Avatar from './Avatar';
import { Employee, Id, Room, roomName } from './chatTypes';
import { Colors } from './Colors';

interface ChatTopBarProps {
  selectedRoom: Room;
  meId: Id | null;
  typingList: string[];
  otherStatus: { is_online?: boolean; last_seen_human?: string } | null;
  otherParticipant: Employee | undefined;
  isOtherOnline: boolean;
  unreadNotifs: number;
  showSearch: boolean;
  showDetail: boolean;
  selectMode: boolean;
  selectedMsgsCount: number;
  isMuted: boolean;
  chatSearch: string;
  searchResultsCount: number | null;
  wsStatus: string;
  onBack: () => void;
  onOpenSidebar: () => void;
  onToggleSearch: () => void;
  onToggleDetail: () => void;
  onToggleSelectMode: () => void;
  onCancelSelect: () => void;
  onBulkDelete: () => void;
  onSearchChange: (v: string) => void;
  onSearchSubmit: () => void;
  onClearSearch: () => void;
}

export default function ChatTopBar({
  selectedRoom, meId, typingList, otherStatus, otherParticipant, isOtherOnline,
  unreadNotifs, showSearch, showDetail, selectMode, selectedMsgsCount, isMuted,
  chatSearch, searchResultsCount, wsStatus,
  onBack, onOpenSidebar, onToggleSearch, onToggleDetail,
  onToggleSelectMode, onCancelSelect, onBulkDelete,
  onSearchChange, onSearchSubmit, onClearSearch,
}: ChatTopBarProps) {
  const [showMenu, setShowMenu] = useState(false);
  const activeMembers = (selectedRoom.room_participants || []).filter(p => p.is_active).length;

  const subtitle = typingList.length > 0
    ? `${typingList.slice(0, 2).join(', ')} typing…`
    : selectedRoom.room_type === 'direct'
      ? (otherStatus?.is_online === true || isOtherOnline)
        ? 'Online'
        : `Last seen ${otherStatus?.last_seen_human || 'recently'}`
      : `${activeMembers} member${activeMembers !== 1 ? 's' : ''}`;

  const isOnline = selectedRoom.room_type === 'direct' && (otherStatus?.is_online === true || isOtherOnline);

  return (
    <View>
      <StatusBar backgroundColor={Colors.headerBg} barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Main header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={Colors.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.roomInfo} onPress={onToggleDetail}>
            <Avatar
              src={selectedRoom.display_icon as string || null}
              initials={roomName(selectedRoom, meId).slice(0, 2).toUpperCase()}
              size="md"
              online={isOtherOnline}
            />
            <View style={styles.roomText}>
              <Text style={styles.roomName} numberOfLines={1}>{roomName(selectedRoom, meId)}</Text>
              <Text style={[styles.subtitle, isOnline && styles.subtitleOnline]} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.actions}>
            {wsStatus !== 'connected' && (
              <View style={styles.wsIndicator}>
                <Text style={styles.wsText}>{wsStatus === 'connecting' ? '⟳' : '✗'}</Text>
              </View>
            )}
            <TouchableOpacity onPress={onToggleSearch} style={[styles.iconBtn, showSearch && styles.iconBtnActive]}>
              <Feather name="search" size={18} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowMenu(v => !v)} style={styles.iconBtn}>
              <Feather name="more-vertical" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Dropdown menu */}
      {showMenu && (
        <View style={styles.dropdown}>
          <TouchableOpacity style={styles.dropdownItem} onPress={() => { onToggleSelectMode(); setShowMenu(false); }}>
            <Feather name="trash" size={15} color={Colors.text} />
            <Text style={styles.dropdownText}>Select Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dropdownItem} onPress={() => { onToggleDetail(); setShowMenu(false); }}>
            <Feather name="info" size={15} color={Colors.text} />
            <Text style={styles.dropdownText}>Chat Info</Text>
            {unreadNotifs > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{unreadNotifs}</Text></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.dropdownItem} onPress={() => setShowMenu(false)}>
            <Feather name={isMuted ? "bell" : "bell-off"} size={15} color={Colors.text} />
            <Text style={styles.dropdownText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dropdownItem, styles.dropdownClose]}
            onPress={() => setShowMenu(false)}
          >
            <Feather name="x" size={15} color={Colors.textSecondary} />
            <Text style={[styles.dropdownText, { color: Colors.textSecondary }]}>Close</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Select mode bar */}
      {selectMode && (
        <View style={styles.selectBar}>
          <Text style={styles.selectText}>{selectedMsgsCount} selected</Text>
          <View style={styles.selectActions}>
            {selectedMsgsCount > 0 && (
              <TouchableOpacity style={styles.selectBtn} onPress={onBulkDelete}>
                <Feather name="trash-2" size={14} color={Colors.error} />
                <Text style={[styles.selectBtnText, { color: Colors.error }]}>Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.selectBtn} onPress={onCancelSelect}>
              <Feather name="x" size={14} color={Colors.textSecondary} />
              <Text style={[styles.selectBtnText, { color: Colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search bar */}
      {showSearch && (
        <View style={styles.searchBar}>
          <Feather name="search" size={14} color={Colors.textSecondary} />
          <TextInput
            value={chatSearch}
            onChangeText={onSearchChange}
            onSubmitEditing={onSearchSubmit}
            placeholder="Search messages…"
            placeholderTextColor={Colors.textLight}
            style={styles.searchInput}
            autoFocus
            returnKeyType="search"
          />
          <TouchableOpacity onPress={onSearchSubmit} style={styles.searchBtn}>
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
          {searchResultsCount !== null && (
            <TouchableOpacity onPress={onClearSearch} style={styles.clearBtn}>
              <Feather name="x" size={14} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {searchResultsCount !== null && showSearch && (
        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>{searchResultsCount} result{searchResultsCount !== 1 ? 's' : ''} for "{chatSearch}"</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Colors.headerBg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5, zIndex: 10 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10, gap: 4,paddingTop: 40   },
  backBtn: { padding: 8 },
  roomInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 },
  roomText: { flex: 1, minWidth: 0 },
  roomName: { color: Colors.white, fontWeight: '600', fontSize: 17 },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  subtitleOnline: { color: '#86efac' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconBtn: { padding: 8, borderRadius: 20 },
  iconBtnActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  wsIndicator: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },
  wsText: { color: Colors.white, fontSize: 12 },
  dropdown: { position: 'absolute', top: 64, right: 8, width: 200, backgroundColor: Colors.white, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8, zIndex: 100 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  dropdownClose: { borderBottomWidth: 0 },
  dropdownText: { fontSize: 14, color: Colors.text, flex: 1 },
  badge: { backgroundColor: Colors.primary, minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  selectBar: { backgroundColor: Colors.surfaceGreen, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.primaryBorder },
  selectText: { fontSize: 13, color: Colors.textSecondary },
  selectActions: { flexDirection: 'row', gap: 16 },
  selectBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  selectBtnText: { fontSize: 13, fontWeight: '600' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  searchBtn: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  searchBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  clearBtn: { padding: 4 },
  resultsBar: { backgroundColor: Colors.surfaceGreen, paddingHorizontal: 16, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.primaryBorder },
  resultsText: { fontSize: 12, color: Colors.textSecondary },
});