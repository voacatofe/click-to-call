import { Softphone } from "@/components/Softphone";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold">Click-to-Call</h1>
      </div>

      <div className="mt-8">
        <Softphone />
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left">
        {/* Conteúdo adicional pode vir aqui */}
      </div>
    </main>
  );
}
