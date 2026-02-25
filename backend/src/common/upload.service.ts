import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
}

@Injectable()
export class UploadService {
  private storageType: 'local' | 's3' | 'minio';
  private baseUrl: string;
  private bucket: string;
  private s3Client: any;
  private localPath: string;

  constructor(private configService: ConfigService) {
    this.storageType = this.configService.get('STORAGE_TYPE', 'local') as 'local' | 's3' | 'minio';
    this.baseUrl = this.configService.get('STORAGE_BASE_URL', '/uploads');
    this.bucket = this.configService.get('S3_BUCKET', 'uncanvas');
    
    if (this.storageType === 's3' || this.storageType === 'minio') {
      this.initS3();
    } else {
      this.localPath = this.configService.get('UPLOAD_PATH', './uploads');
    }
  }

  private async initS3() {
    const { S3Client } = await import('@aws-sdk/client-s3');
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY', ''),
      },
      endpoint: this.configService.get('S3_ENDPOINT'),
      forcePathStyle: this.storageType === 'minio',
    });
  }

  async uploadFile(file: Buffer, filename: string, mimeType: string): Promise<UploadResult> {
    const ext = filename.split('.').pop();
    const key = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;

    if (this.storageType === 'local') {
      return this.uploadLocal(file, key);
    } else {
      return this.uploadS3(file, key, mimeType);
    }
  }

  private async uploadLocal(file: Buffer, key: string): Promise<UploadResult> {
    const fs = await import('fs');
    const path = await import('path');
    
    const timestamp = key.split('-')[1]?.split('.')[0] || key.substring(0, 8);
    const dir = path.join(this.localPath, timestamp.substring(0, 8));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const fullPath = path.join(dir, key);
    fs.writeFileSync(fullPath, file);

    return {
      url: `${this.baseUrl}/${timestamp.substring(0, 8)}/${key}`,
      key: `${timestamp.substring(0, 8)}/${key}`,
      bucket: 'local',
    };
  }

  private async uploadS3(file: Buffer, key: string, mimeType: string): Promise<UploadResult> {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: mimeType,
    });

    await this.s3Client.send(command);

    let url: string;
    if (this.storageType === 'minio') {
      url = `${this.configService.get('S3_ENDPOINT')}/${this.bucket}/${key}`;
    } else {
      const region = this.configService.get('AWS_REGION', 'us-east-1');
      url = `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
    }

    return {
      url,
      key,
      bucket: this.bucket,
    };
  }

  async deleteFile(key: string): Promise<void> {
    if (this.storageType === 'local') {
      const fs = await import('fs');
      const path = await import('path');
      const fullPath = path.join(this.localPath, key);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } else {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.s3Client.send(command);
    }
  }

  async uploadBase64Image(base64Data: string, type: 'character' | 'scene' | 'generated'): Promise<UploadResult> {
    const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid base64 data');
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `${type}-${Date.now()}.${mimeType.split('/')[1]}`;

    return this.uploadFile(buffer, filename, mimeType);
  }
}
