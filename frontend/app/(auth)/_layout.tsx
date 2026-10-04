import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="registro" />
      <Stack.Screen name="registro-paciente" />
      <Stack.Screen name="registro-medico" />
    </Stack>
  );
}
