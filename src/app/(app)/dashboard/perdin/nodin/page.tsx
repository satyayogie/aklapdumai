import { FileText, Sparkles } from "lucide-react";
import { AddNotaForm } from "./_components/add-nota-form";

export const metadata = {
  title: "Nota Dinas - Sistem Perjalanan Dinas",
  description: "Buat dan kelola Nota Dinas dengan mudah dan cepat"
};

export default async function NotaDinasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Modern Hero Section */}
        <div className="relative mb-12">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-20 right-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="text-center space-y-6">
            {/* Icon with modern styling */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 group">
              <FileText className="h-10 w-10 text-white group-hover:scale-110 transition-transform duration-300" />
            </div>

            {/* Title with gradient text */}
            <div className="space-y-3">
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 dark:from-white dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent leading-tight">
                Nota Dinas
              </h1>

              <div className="flex items-center justify-center gap-2 text-lg md:text-xl text-slate-600 dark:text-slate-300 font-medium">
                <Sparkles className="h-5 w-5 text-blue-500 animate-pulse" />
                <span>Buat dokumen resmi dengan mudah dan profesional</span>
                <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse delay-500" />
              </div>
            </div>

            {/* Subtle stats or info */}
            <div className="flex items-center justify-center gap-8 text-sm text-slate-500 dark:text-slate-400 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Siap Cetak</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300" />
                <span>Auto Format</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-700" />
                <span>Digital Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Form Container */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-3xl blur-lg opacity-60" />

          {/* Main form */}
          <div className="relative">
            <AddNotaForm />
          </div>
        </div>
      </div>
    </div>
  );
}
