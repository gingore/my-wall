'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import ProfilePic from '@/components/ui/ProfilePic'
import Image from 'next/image'
import { supabase } from '../lib/supabase'


type Post = {
  id: string
  body: string
  created_at: string
  image_url?: string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function Home() {
  const [message, setMessage] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
      setPosts(data ?? [])
    }

    fetchPosts()

    const channel = supabase
      .channel('posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload: { new: Post }) => {
          setPosts((current) => [payload.new, ...current])
        }
      )
      .subscribe()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const handleSubmit = async () => {
    if (!message.trim()) return 
    setLoading(true)
    setErrorMsg('')
    let imageUrl = ''
    if (image) {
      if (image.size > MAX_FILE_SIZE) {
        setErrorMsg('File is too large. Max size is 5MB.')
        setLoading(false)
        return
      }
      try {
        const fileExt = image.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const { data, error: uploadError } = await supabase.storage.from('wall-images').upload(fileName, image, {
          cacheControl: '3600',
          upsert: false,
          contentType: image.type
        })
        if (uploadError) {
          setErrorMsg(`Failed to upload photo: ${uploadError.message}`)
          setLoading(false)
          return
        }
        if (data) {
          const { data: urlData } = supabase.storage.from('wall-images').getPublicUrl(fileName)
          imageUrl = urlData.publicUrl
        }
      } catch (err) {
        setErrorMsg('Failed to upload photo. Please try again.')
        setLoading(false)
        return
      }
    }
    const { error } = await supabase.from('posts').insert([{ body: message, image_url: imageUrl }])
    if (!error) {
      setMessage('')
      setImage(null)
    } else {
      setErrorMsg(`Failed to post: ${error.message}`)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-transparent text-[#a47d6d]">
      <div style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundImage: "url('/neopolitan.jpg')", backgroundRepeat: 'repeat', backgroundPosition: 'center', backgroundSize: 'cover', opacity: 0.5, zIndex: -10}}></div>
      <div className="relative flex flex-col md:flex-row justify-center items-start w-full px-2 md:px-0">
        <div className="w-full md:w-4/5 bg-[#fdf9fb] rounded-2xl shadow-lg p-4 md:p-10 mt-4 md:mt-10 border border-[#a47d6d]">
          <div className="w-full bg-[#f8ced5] rounded-lg mb-4 md:mb-8 flex justify-center items-center">
            <h1 className="text-2xl md:text-4xl font-bold text-center px-3 md:px-6 py-3 md:py-4 text-[#a47d6d]">˚₊‧꒰ა  Lena&apos;s Wall ໒꒱ ‧₊˚</h1>
          </div>
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center md:items-start">
            <div className="w-full flex flex-col items-center mb-4 md:mb-0">
              <ProfilePic className="w-48 h-48 md:w-56 md:h-56 rounded-xl border !border-[#a47d6d] mx-auto" />
              <div className="w-full flex flex-col items-center gap-2 md:gap-4 mt-2 md:mt-4 text-center">
                <div className="w-full border border-[#a47d6d] rounded-lg p-2 md:p-3 bg-white mb-2 text-center">
                  <h2 className="font-semibold text-xl md:text-3xl mb-0">Lena Tran</h2>
                  <div className="text-xs md:text-sm py-1 md:py-2">03 | she/her | ISFJ</div>
                </div>
                <div className="w-full border border-[#a47d6d] rounded-lg p-2 md:p-3 bg-white text-center">
                  <div className="font-bold mb-0">Networks</div>
                  <div className="text-xs md:text-sm mb-0">UT Arlington Alumna</div>
                  <div className="font-bold mt-2 md:mt-4 mb-0">Current City</div>
                  <div className="text-xs md:text-sm mb-0">Grand Prairie, TX</div>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-4 md:space-y-6 px-0 md:px-4 flex flex-col items-center md:items-start">
              <div className="space-y-2 md:space-y-3">
                <Textarea
                  maxLength={280}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's on your mind?"
                  className="min-h-[80px] md:min-h-[120px] text-base md:text-xl p-3 md:p-4 border border-[#a47d6d] focus:border-[#a47d6d] focus:ring-[#a47d6d] focus:ring-1 placeholder:text-[#a47d6d]"
                />
                <div className="flex justify-center md:justify-between items-center w-full">
                  <span className="text-xs md:text-sm">{280 - message.length} characters left</span>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-2 md:gap-3 mt-2 w-full">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="font-semibold px-3 py-2 md:px-4 md:py-2 rounded-lg border border-[#a47d6d] border-dotted bg-[#fdf9fb] text-[#a47d6d] transition hover:bg-[#fdf9fb] hover:text-[#a47d6d] hover:border-[#a47d6d] hover:border-solid"
                    >
                      Upload Image (optional)
                    </Button>
                    {image && (
                      <span className="flex items-center gap-2">
                        <span className="text-base md:text-lg font-medium text-[#a47d6d]">{image.name}</span>
                        <button
                          type="button"
                          onClick={() => setImage(null)}
                          className="text-gray-400 hover:text-red-500 text-base md:text-lg font-bold px-2 focus:outline-none"
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    <input
                      ref={fileInputRef}
                      id="image-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/gif"
                      style={{ display: 'none' }}
                      onChange={e => setImage(e.target.files?.[0] || null)}
                    />
                  </div>
                  <Button
                    disabled={(!message.trim() && !image) || loading}
                    onClick={handleSubmit}
                    className="font-semibold px-3 py-2 md:px-4 md:py-2 rounded-lg border border-[#a47d6d] border-solid bg-[#f8ced5] text-[#a47d6d] transition hover:bg-[#fdf9fb] hover:text-[#a47d6d] hover:border-[#a47d6d]"
                  >
                    {loading ? 'Sharing...' : 'Share'}
                  </Button>
                </div>
                <span className="text-xs md:text-sm mt-1 block">Supported: PNG, JPG, GIF, up to 5MB</span>
                {errorMsg && <div className="text-red-500 text-xs md:text-sm mt-2">{errorMsg}</div>}
              </div>
              <div className="space-y-2 md:space-y-4 w-full flex flex-col items-center">
                {posts.map((post) => (
                  <div key={post.id} className="border border-[#a47d6d] rounded-xl p-2 md:p-4 shadow-sm bg-white w-full max-w-md">
                    <p className="text-base md:text-lg">{post.body}</p>
                    {post.image_url && (
                      <div className="mt-2">
                        <Image src={post.image_url} alt="Wall post" width={320} height={240} className="rounded-lg max-w-xs object-cover" />
                      </div>
                    )}
                    <span className="text-xs md:text-[#a47d6d]">{new Date(post.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
