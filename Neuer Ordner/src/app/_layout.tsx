import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Spanisch lernen",
        }}
      />

      <Stack.Screen
        name="vokabeln"
        options={{
          title: "Vokabeln",
        }}
      />
    </Stack>
  );
}