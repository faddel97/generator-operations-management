import type { UploadedAttachment } from "@/types/app";

function isImageAttachment(attachment: UploadedAttachment) {
  return /\.(png|jpe?g|webp|gif)$/i.test(attachment.path);
}

function isVideoAttachment(attachment: UploadedAttachment) {
  return /\.(mp4|webm|mov|m4v)$/i.test(attachment.path);
}

function formatUploadedDate(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export function AttachmentList({ attachments, compact = false }: { attachments: UploadedAttachment[]; compact?: boolean }) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className={compact ? "mt-2 space-y-2" : "grid gap-3 md:grid-cols-2 xl:grid-cols-3"}>
      {attachments.map((attachment) => {
        const uploadedDate = formatUploadedDate(attachment.createdAt);
        const imagePreview = attachment.url && isImageAttachment(attachment);
        const videoPreview = attachment.url && isVideoAttachment(attachment);

        return (
          <div key={`${attachment.bucket}:${attachment.path}`} className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex gap-3">
              {imagePreview ? (
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="h-14 w-14 shrink-0 rounded-md border border-slate-200 bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${attachment.url})` }}
                  aria-label={`Open ${attachment.fileName}`}
                />
              ) : null}
              {videoPreview ? (
                <video controls preload="metadata" className="h-24 w-40 shrink-0 rounded-md border border-slate-200 bg-black" src={attachment.url} />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-900">{attachment.fileName}</div>
                <div className="mt-1 truncate text-xs text-slate-500">{attachment.path}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  {attachment.url ? (
                    <a href={attachment.url} target="_blank" rel="noreferrer" className="font-semibold text-teal-700 hover:text-teal-900">
                      Open
                    </a>
                  ) : (
                    <span className="font-semibold text-slate-500">Stored</span>
                  )}
                  {uploadedDate ? <span className="text-slate-500">Uploaded {uploadedDate}</span> : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
