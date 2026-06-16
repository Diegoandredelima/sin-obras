import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './src/store/auth';
import CheckinScreen from './src/screens/CheckinScreen';
import ChecklistScreen from './src/screens/ChecklistScreen';
import ResultadoVistoriaScreen from './src/screens/ResultadoVistoriaScreen';
import SyncScreen from './src/screens/SyncScreen';

// Placeholder screens
import { View, StyleSheet } from 'react-native';

function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.centered}>
      <Text style={styles.homeTitle}>SIN-Obras Fiscal</Text>
      <Text style={styles.homeSub}>Selecione uma vistoria para iniciar</Text>
      {/* Botão de check-in para demo */}
      <Text
        style={styles.homeBtn}
        onPress={() => navigation.navigate('Checkin')}
      >
        📍 Iniciar Check-in
      </Text>
    </View>
  );
}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#15803d',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { borderTopColor: '#f1f5f9' },
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '700', color: '#0f172a' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Obras',
          tabBarIcon: ({ color }: { color: string }) => <Text style={{ fontSize: 20 }}>🏗</Text>,
        }}
      />
      <Tab.Screen
        name="Sync"
        component={SyncScreen}
        options={{
          title: 'Sincronizar',
          tabBarIcon: ({ color }: { color: string }) => <Text style={{ fontSize: 20 }}>⟳</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { loadFromStorage, isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: '#fff' },
              headerTitleStyle: { fontWeight: '700', color: '#0f172a' },
              headerTintColor: '#15803d',
            }}
          >
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="Checkin" component={CheckinScreen} options={{ title: 'Check-in na Obra' }} />
            <Stack.Screen name="Checklist" component={ChecklistScreen} options={{ title: 'Checklist de Vistoria' }} />
            <Stack.Screen name="ResultadoVistoria" component={ResultadoVistoriaScreen} options={{ title: 'Resultado da Vistoria' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32, backgroundColor: '#f8fafc' },
  homeTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  homeSub: { fontSize: 16, color: '#64748b' },
  homeBtn: {
    marginTop: 8, backgroundColor: '#15803d', color: '#fff',
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14,
    fontSize: 16, fontWeight: '700', overflow: 'hidden',
  },
});
