// app/(dashboard)/login/page.tsx — halaman login (URL: /login).
// Fungsi: gerbang masuk area dashboard. Dirender TANPA shell dashboard
//         (login berada di group (dashboard) tapi di luar folder dashboard/).
// Isi: form login (Server Action nanti) + validasi.
export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <h1 className="text-xl font-semibold">Login</h1>
    </div>
  );
}
