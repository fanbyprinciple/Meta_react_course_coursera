import { Stack } from "expo-router";
import { StatusBar } from "react-native";

export default function RootLayout() {
    return(
      <>
        <StatusBar barStyle="dark-content" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#000" },
            animation: "slide_from_right",
            header: () => null,
            navigationBarHidden: true,
          }}
        />
        {/* <Stack.Screen name="(home)" options={{ headerShown: false }} /> */}
      </>
    );
}