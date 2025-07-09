import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import Logout from "./logout";
import { Button } from "@/components/ui/button";

const standards = [
  "KG1",
  "KG2",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
];

export default async function Home() {
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="flex justify-between items-center mb-8">
        <Link href="/absent" prefetch={false}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Attendance Reason
          </Button>
        </Link>
        <div className="ml-auto">
          <Logout />
        </div>
      </header>

      <h1 className="text-3xl font-bold mb-8 text-white">
        School Mark Management
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {standards.map((standard) => (
          <Link
            prefetch={false}
            href={`/standard/${standard}`}
            key={standard}
            className="block"
          >
            <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-colors">
              <CardHeader>
                <CardTitle className="text-center text-white">
                  Standard {standard}
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
