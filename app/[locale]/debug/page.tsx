import StreamingDebug from "@/components/streaming-debug"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default function DebugPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Streaming API Debug</h1>
        <p className="text-gray-600">Test and debug the streaming functionality</p>
      </div>

      <Card className="mb-6 border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="w-5 h-5" />
            Development Only
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-orange-700">
            This debug console is for development and testing purposes only. Make sure to remove or protect this page in
            production.
          </p>
        </CardContent>
      </Card>

      <StreamingDebug />
    </div>
  )
}
