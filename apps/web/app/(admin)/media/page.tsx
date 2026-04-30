import { listUploads } from './actions';
import { MediaGrid } from './media-grid';

export const dynamic = 'force-dynamic';

export default async function MediaPage() {
  const items = await listUploads();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Media</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Uploaded images and files. Reference these from image fields on any page.
        </p>
      </div>

      <MediaGrid
        initialUploads={items.map((u) => ({
          id: u.id,
          filename: u.filename,
          originalName: u.originalName,
          mime: u.mime,
          size: u.size,
          width: u.width,
          height: u.height,
          alt: u.alt,
        }))}
      />
    </div>
  );
}
