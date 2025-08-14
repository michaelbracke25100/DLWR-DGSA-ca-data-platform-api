import { DefaultAzureCredential } from '@azure/identity';
import { AppendBlobAppendBlockResponse, BlobServiceClient, BlobUploadCommonResponse, BlockBlobCommitBlockListResponse, BlockBlobStageBlockResponse, ContainerSASPermissions, generateBlobSASQueryParameters, SASQueryParameters, ServiceGetUserDelegationKeyResponse } from '@azure/storage-blob';
import { Readable } from 'stream';

class StorageService {
  private id_clientid: string;
  constructor(id_clientid: string) {
    this.id_clientid = id_clientid;
  }

  // * A function that gets a stream from azure storage.
  async getStream(storage_name: string, container: string, path: string): Promise<{ Stream: NodeJS.ReadableStream | null; contentType: string | null }> {
    try {
      // Azure Blob Storage Client Configuration (consider environment variables)
      const default_azure_credential = new DefaultAzureCredential({
        managedIdentityClientId: this.id_clientid,
      });

      const blobService_client = new BlobServiceClient(`https://${storage_name}.blob.core.windows.net`, default_azure_credential);

      // Retrieve Container and Blob Clients
      const container_client = blobService_client.getContainerClient(container);
      const block_blob_client = container_client.getBlockBlobClient(path);
      const blob_properties = await block_blob_client.getProperties();
      const contentType = blob_properties.contentType || 'application/octet-stream';

      // Download Blob with Error Handling
      const download_block_blob_response = await block_blob_client.download(0);
      if (!download_block_blob_response.readableStreamBody) {
        console.error('Error: Blob not found or inaccessible.');
        return {
          Stream: null,
          contentType: null,
        };
      }

      return {
        Stream: download_block_blob_response.readableStreamBody,
        contentType,
      };
    } catch (error) {
      console.error('Error downloading blob stream:', error);
      return {
        Stream: null,
        contentType: null,
      };
    }
  }

  async uploadStream(storage_name: string, container_name: string, blob_name: string, stream: Readable): Promise<BlobUploadCommonResponse> {
    // Azure Blob Storage Client Configuration (consider environment variables)
    const default_azure_credential = new DefaultAzureCredential({
      managedIdentityClientId: this.id_clientid,
    });

    const blob_service_client = new BlobServiceClient(`https://${storage_name}.blob.core.windows.net`, default_azure_credential);
    const container_client = blob_service_client.getContainerClient(container_name);

    const block_blob_client = container_client.getBlockBlobClient(blob_name);
    return await block_blob_client.uploadStream(stream);
  }

  async blobExists(storage_name: string, container_name: string, blob_name: string): Promise<boolean> {
    const default_azure_credential = new DefaultAzureCredential({ managedIdentityClientId: this.id_clientid });

    const blob_service_client = new BlobServiceClient(`https://${storage_name}.blob.core.windows.net`, default_azure_credential);
    const container_client = blob_service_client.getContainerClient(container_name);

    const block_blob_client = container_client.getBlockBlobClient(blob_name);
    return await block_blob_client.exists();
  }

  // * Function to append a block to a blob
  async putBlock(storage_name: string, container_name: string, blob_name: string, block_id: string, blockData: Buffer | Uint8Array): Promise<BlockBlobStageBlockResponse> {
    const default_azure_credential = new DefaultAzureCredential({ managedIdentityClientId: this.id_clientid });

    const blob_service_client = new BlobServiceClient(`https://${storage_name}.blob.core.windows.net`, default_azure_credential);
    const container_client = blob_service_client.getContainerClient(container_name);

    const block_blob_client = container_client.getBlockBlobClient(blob_name);
    return await block_blob_client.stageBlock(block_id, blockData, blockData.length);
  }

  // * Function to complete a blocklist for a blob
  async putBlockList(storage_name: string, container_name: string, blob_name: string, block_list: string[]): Promise<BlockBlobCommitBlockListResponse> {
    // Azure Blob Storage Client Configuration (consider environment variables)
    const default_azure_credential = new DefaultAzureCredential({ managedIdentityClientId: this.id_clientid });

    const blob_service_client = new BlobServiceClient(`https://${storage_name}.blob.core.windows.net`, default_azure_credential);
    const container_client = blob_service_client.getContainerClient(container_name);

    const block_blob_client = container_client.getBlockBlobClient(blob_name);
    return await block_blob_client.commitBlockList(block_list);
  }

  // Function to copy a blob
  async copyBlob(origin_storage_name: string, origin_container_name: string, origin_blob_path: string, destination_storage_name: string, destination_container_name: string, destination_blob_path: string) {
    const default_azure_credential = new DefaultAzureCredential({
      managedIdentityClientId: this.id_clientid,
    });

    const origin_blobservice_client = new BlobServiceClient(`https://${origin_storage_name}.blob.core.windows.net`, default_azure_credential);
    const origin_container_client = origin_blobservice_client.getContainerClient(origin_container_name);
    const origin_blockblob_client = origin_container_client.getBlockBlobClient(origin_blob_path);

    const destination_blobservice_client = new BlobServiceClient(`https://${destination_storage_name}.blob.core.windows.net`, default_azure_credential);
    const destination_container_client = destination_blobservice_client.getContainerClient(destination_container_name);
    const destination_blockblob_client = destination_container_client.getBlockBlobClient(destination_blob_path);
    const sas_token = await generateBlobSasUrlQueryParams(origin_blobservice_client, origin_container_name);

    const origin_blockblob_url = `${origin_blockblob_client.url}?${sas_token.toString()}`;
    const copy = await destination_blockblob_client.beginCopyFromURL(origin_blockblob_url);
    return await copy.pollUntilDone();
  }

  // Function to delete a blob
  async deleteBlob(storage_name: string, container_name: string, blob_path: string) {
    const default_azure_credential = new DefaultAzureCredential({
      managedIdentityClientId: this.id_clientid,
    });

    const blobservice_client = new BlobServiceClient(`https://${storage_name}.blob.core.windows.net`, default_azure_credential);
    const container_client = blobservice_client.getContainerClient(container_name);
    const blockblob_client = container_client.getBlockBlobClient(blob_path);
    console.log(`Delete blob: ${blockblob_client.url}`);
    return await blockblob_client.deleteIfExists();
  }
}

async function generateBlobSasUrlQueryParams(blobServiceClient: BlobServiceClient, containerName: string, tokenValidityMinutes = 60): Promise<SASQueryParameters> {
  const startDate: Date = new Date();
  const expiryDate: Date = new Date();
  startDate.setMinutes(startDate.getMinutes() - 5);
  expiryDate.setMinutes(expiryDate.getMinutes() + tokenValidityMinutes);

  const userDelegationKey: ServiceGetUserDelegationKeyResponse = await blobServiceClient.getUserDelegationKey(startDate, expiryDate);
  return generateBlobSASQueryParameters(
    {
      containerName,
      permissions: ContainerSASPermissions.parse('r'),
      startsOn: startDate,
      expiresOn: expiryDate,
    },
    userDelegationKey,
    blobServiceClient.accountName,
  );
}

export default StorageService;
