# Credential Manager находит реализацию Google Play Services через рефлексию
-if class androidx.credentials.CredentialManager
-keep class androidx.credentials.playservices.** {
  *;
}
