/**
 * UploadThing file route — generic file upload
 * Files are stored in UploadThing's storage, metadata is saved in DB.
 */
import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { audit } from '@/lib/audit';
import { UploadThingError } from 'uploadthing/server';

const f = createUploadthing();

export const ourFileRouter = {
  // Generic file upload — up to 4 MB, max 4 files
  genericUploader: f({
    image: { maxFileSize: '4MB', maxFileCount: 4 },
    pdf: { maxFileSize: '8MB', maxFileCount: 4 },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      maxFileSize: '8MB',
      maxFileCount: 4,
    },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
      maxFileSize: '8MB',
      maxFileCount: 4,
    },
  })
    .middleware(async ({ files }) => {
      const session = await auth();
      if (!session?.user?.id) throw new UploadThingError('UNAUTHORIZED');
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db.uploadFile.create({
        data: {
          userId: metadata.userId,
          fileKey: file.key,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileUrl: file.url,
        },
      });
      await audit.log({
        userId: metadata.userId,
        action: 'file.upload',
        entity: 'UploadFile',
        entityId: file.key,
        metadata: { name: file.name, size: file.size, type: file.type },
      });
      return { fileKey: file.key, fileUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
