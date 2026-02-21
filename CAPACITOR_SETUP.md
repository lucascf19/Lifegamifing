# Configuração do Capacitor para Notificações Nativas

Este documento explica como instalar e configurar o Capacitor para usar notificações nativas no sistema de medicamentos.

## 📦 Instalação

### 1. Instalar Capacitor Core e Local Notifications

```bash
npm install @capacitor/core @capacitor/local-notifications
```

### 2. Instalar Capacitor CLI (globalmente ou como dev dependency)

```bash
npm install -D @capacitor/cli
```

### 3. Inicializar Capacitor (se ainda não foi feito)

```bash
npx cap init
```

Quando solicitado:
- **App name**: App Gamificação
- **App ID**: com.appgamificacao (ou seu bundle ID)
- **Web dir**: dist (ou o diretório de build)

### 4. Adicionar plataformas (Android/iOS)

Para Android:
```bash
npx cap add android
```

Para iOS:
```bash
npx cap add ios
```

### 5. Sincronizar após build

Após fazer o build do projeto:
```bash
npm run build
npx cap sync
```

## 🔧 Configuração

### Android

1. Abra o projeto Android no Android Studio:
   ```bash
   npx cap open android
   ```

2. No arquivo `AndroidManifest.xml`, adicione permissões:
   ```xml
   <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
   ```

3. No arquivo `build.gradle` (app level), certifique-se de ter:
   ```gradle
   minSdkVersion 21
   ```

### iOS

1. Abra o projeto iOS no Xcode:
   ```bash
   npx cap open ios
   ```

2. No `Info.plist`, adicione a descrição de uso:
   ```xml
   <key>NSUserNotificationsUsageDescription</key>
   <string>Precisamos de permissão para enviar lembretes de medicamentos</string>
   ```

## 📱 Uso no App

O código já está preparado para funcionar automaticamente:

1. **Com Capacitor**: Usa notificações nativas com botões de ação
2. **Sem Capacitor**: Usa fallback com Notification API do navegador (funciona apenas no navegador, não em app nativo)

### Verificação

O app verifica automaticamente se o Capacitor está disponível. Você verá no console:
- ✅ `Capacitor LocalNotifications carregado` - se estiver funcionando
- ⚠️ `Capacitor não disponível, usando fallback` - se não estiver instalado

## 🎯 Funcionalidades

### Notificações com Botões

As notificações de medicamentos incluem dois botões:
- **Confirmar Ingestão**: Decrementa estoque e adiciona +20 XP
- **Adiar 30 min**: Agenda nova notificação para 30 minutos depois

### Aura de Alerta

Se um horário de medicamento passar sem confirmação, a borda da tela pulsa em branco intenso para alertar o usuário.

## 🔄 Workflow de Desenvolvimento

1. Faça alterações no código
2. Execute `npm run build`
3. Execute `npx cap sync` para sincronizar com as plataformas nativas
4. Teste no emulador/dispositivo:
   - Android: `npx cap open android` → Run no Android Studio
   - iOS: `npx cap open ios` → Run no Xcode

## 📝 Notas Importantes

- As notificações só funcionam em apps nativos (Android/iOS), não no navegador web
- No navegador, o sistema usa fallback mas não terá os botões de ação
- Certifique-se de solicitar permissão de notificações ao usar o app pela primeira vez
