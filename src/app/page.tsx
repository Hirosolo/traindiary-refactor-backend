export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-zinc-950 text-white">
      <h1 className="text-4xl font-bold mb-4">TrainDiary API</h1>
      <p className="text-zinc-400">Refactored to Clean Architecture with Next.js 15.5.x</p>
      <div className="mt-8 flex gap-4">
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
          <h2 className="font-semibold mb-2">Auth Module</h2>
          <ul className="text-sm text-zinc-500">
            <li>POST /api/auth/signup</li>
            <li>POST /api/auth/login</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
          <h2 className="font-semibold mb-2">Foods & Exercises</h2>
          <ul className="text-sm text-zinc-500">
            <li>GET /api/foods</li>
            <li>GET /api/exercises</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
          <h2 className="font-semibold mb-2">Logs & Progress</h2>
          <ul className="text-sm text-zinc-500">
            <li>GET/POST /api/meals</li>
            <li>GET/POST /api/workouts</li>
            <li>GET /api/progress</li>
          </ul>
        </div>
      </div>
      <div className="mt-12">
        <a 
          href="/api-docs" 
          className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 transition-colors font-semibold"
        >
          Explore API with Swagger
        </a>
      </div>
    </main>
  );
}
