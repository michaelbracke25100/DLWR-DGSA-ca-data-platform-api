import {DefaultAzureCredential} from '@azure/identity';
import {KeyVaultSecret, SecretClient} from '@azure/keyvault-secrets';

class KeyvaultService {
  private id_clientid: string;
  private keyvault_url: string;
  private env: string;
  constructor(id_clientid: string, keyvault_url: string, env: string) {
    this.id_clientid = id_clientid;
    this.keyvault_url = keyvault_url;
    this.env = env;
  }

  async getSecretValue(secret_name: string): Promise<string | undefined> {
    if (this.env != 'LOCAL') {
      try {
        const default_azure_credential = new DefaultAzureCredential({
          managedIdentityClientId: this.id_clientid,
        });
        // Create a SecretClient instance
        const secret_client = new SecretClient(this.keyvault_url, default_azure_credential);
        const secret = await secret_client.getSecret(secret_name);
        return secret.value;
      } catch (error) {
        console.error(`Error retrieving secret ${secret_name}:`, error);
        return undefined;
      }
    } else {
      console.log(`Mock ${secret_name}`);
      return 'fake';
    }
  }

  async setSecret(secret_name: string, secret_value: string): Promise<KeyVaultSecret | undefined> {
    if (this.env != 'LOCAL') {
      try {
        const default_azure_credential = new DefaultAzureCredential({
          managedIdentityClientId: this.id_clientid,
        });
        // Create a SecretClient instance
        const secret_client = new SecretClient(this.keyvault_url, default_azure_credential);
        const keyvault_secret = await secret_client.setSecret(secret_name, secret_value); // Will create a new version if needed
        if (keyvault_secret) {
          return keyvault_secret;
        } else {
          return undefined;
        }
      } catch (error) {
        console.error(`Error setting secret ${secret_name}:`, error);
        return undefined;
      }
    } else {
      console.log(`Mock ${secret_name}`);
      return {name: secret_name, properties: {vaultUrl: `${this.keyvault_url}/${secret_name}`, name: secret_name}};
    }
  }
}
export default KeyvaultService;
