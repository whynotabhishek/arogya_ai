'use client'
import { ArogyaChat } from "@/components/ui/arogya-chat"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  return (
    <ArogyaChat
      title="ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಮಸ್ಯೆ"
      subtitle="Speak in Kannada, Hindi, or English. No typing required."
      announcementText="Powered by Murf Falcon · <130ms Voice"
      placeholder="ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಮಸ್ಯೆ ಹೇಳಿ..."
      onSend={(message) => {
        localStorage.setItem('arogya_initial_query', message)
        router.push('/assistant')
      }}
    />
  )
}
