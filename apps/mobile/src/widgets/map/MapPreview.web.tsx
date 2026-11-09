import { StyleSheet, Text, View } from "react-native";
export function MapPreview() {
  return (
    <View style={styles.map}>
      <Text style={styles.title}>지도 미리보기</Text>
      <Text style={styles.text}>웹 지도는 Next.js 웹앱에서 이용해주세요.</Text>
      <Text style={styles.text}>
        이 화면에서도 기존 API로 장소 검색과 등록을 할 수 있어요.
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  map: {
    height: 205,
    backgroundColor: "#e8edf1",
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 10,
    color: "#191f28",
  },
  text: { color: "#6b7684", fontSize: 12, lineHeight: 20 },
});
