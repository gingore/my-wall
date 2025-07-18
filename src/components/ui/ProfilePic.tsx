import Image from "next/image"

export default function ProfilePic({ className = "" }: { className?: string }) {
  return (
    <div className={`overflow-hidden border border-gray-300 shrink-0 ${className}`}>
      <Image
        src="/profilePic.gif"
        alt="Lena's profile photo"
        width={128}
        height={128}
        className="object-cover w-full h-full"
      />
    </div>
  )
}
