export function AdminNotice({ saved, error }: { saved?: string; error?: string }) {
  if (error) return <p role="alert" className="alert alert-error">{error}</p>;
  if (saved) return <p role="status" className="alert alert-ok">{saved}</p>;
  return null;
}
