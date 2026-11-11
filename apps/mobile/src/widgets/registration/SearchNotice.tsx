import { Modal, View, Text, StyleSheet } from "react-native";
import type { RegistrationApiError } from "@food-map/registration";
import { ActionButton } from "../../shared/ui";
export function SearchNotice({ notice, onClose }: { notice: RegistrationApiError | null; onClose: () => void }) {
  return <Modal visible={notice !== null} transparent animationType="fade" onRequestClose={onClose}>
    <View style={s.backdrop}><View style={s.card} accessibilityViewIsModal accessibilityLabel="검색 제한 안내">
      <Text style={s.title} accessibilityRole="header">검색을 잠시 중단했어요</Text>
      <Text style={s.copy}>{notice?.message}</Text>
      {notice?.resetAt && <Text style={s.copy}>한도 갱신 시각: {new Date(notice.resetAt).toLocaleString("ko-KR")}
월별 사용량 확인 후 다시 이용할 수 있어요.</Text>}
      <Text style={s.copy}>이미 선택한 장소의 카테고리는 계속 정리할 수 있어요.</Text>
      <ActionButton label="확인" onPress={onClose} />
    </View></View>
  </Modal>;
}
const s = StyleSheet.create({ backdrop: { flex:1, backgroundColor:"rgba(0,0,0,.4)", justifyContent:"center", padding:24 },
  card: { backgroundColor:"white",borderRadius:20,padding:24,gap:16,maxWidth:440,width:"100%",alignSelf:"center" },
  title: { fontSize:22,fontWeight:"700",color:"#191f28" }, copy: { fontSize:15,lineHeight:24,color:"#4e5968" } });
