import Footer from "@/components/atoms/Footer"
import Header from "@/components/atoms/Header"

export const metadata = {
  title: 'Drep Home',
  description: 'DRep Home Module',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" >
      <body>
        <Header/>
        {children}
        <Footer/>
        </body>
    </html>
  )
}
