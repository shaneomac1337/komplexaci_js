export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
        <div className="text-white text-xl font-semibold">Načítání Counter-Strike 2...</div>
        <div className="text-gray-400 text-sm mt-2">Připravujeme zbraně a mapy</div>
      </div>
    </div>
  );
}
