import { createClient } from "@/lib/supabase/server";
import { getEvents } from "@/app/actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Calendar, ChevronRight } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const events = await getEvents();

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="mb-8">
        <p className="text-muted-foreground mt-1">Selecione um evento para começar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/event/${event.slug}`}
            className="group relative overflow-hidden rounded-3xl bg-card border border-border/50 hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1"
          >
            <div className="aspect-video w-full bg-muted relative overflow-hidden">
              {event.image_url ? (
                <Image
                  src={event.image_url}
                  alt={event.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                  <Calendar className="w-12 h-12 text-primary/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-60" />
            </div>

            <div className="p-6 space-y-2 relative">
              <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                {event.name}
              </h2>
              <div className="flex items-center text-xs text-muted-foreground mb-2">
                <Calendar className="w-3 h-3 mr-1" />
                {event.start_date && event.end_date
                  ? `${new Date(event.start_date).toLocaleDateString()} - ${new Date(event.end_date).toLocaleDateString()}`
                  : "Data a definir"}
              </div>
              {event.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {event.description}
                </p>
              )}
              <div className="pt-4 flex items-center text-sm font-medium text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                Entrar no Evento <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </Link>
        ))}

        {events.length === 0 && (
          <div className="col-span-full text-center py-20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Nenhum evento ativo</h3>
            <p className="text-muted-foreground">Volte mais tarde para novos eventos.</p>
          </div>
        )}
      </div>
    </main>
  );
}
