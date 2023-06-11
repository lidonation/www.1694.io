import Head from 'next/head'
import { Card } from '@/components/Card'
import { Section } from '@/components/Section'
import { SimpleLayout } from '@/components/SimpleLayout'
import cipNutShellImage from '@/images/photos/iog-cip-in-a-nutshell.png'

function WorkshopSection({ children, ...props }) {
  return (
    <Section {...props}>
      <div className="space-y-16">{children}</div>
    </Section>
  )
}

function Appearance({ title, description, event, cta, href, target="_self" }) {
  return (
    <Card as="article">
      <Card.Title as="h3" href={href} target={target}>
        {title}
      </Card.Title>
      <Card.Eyebrow decorate>{event}</Card.Eyebrow>
      <Card.Description>{description}</Card.Description>
      <Card.Cta>{cta}</Card.Cta>
    </Card>
  )
}

export default function Speaking({whorkshops}) {
  return (
    <>
      <Head>
        <title>Workshops - 1694 Global Workshops</title>
        <meta
          name="description"
          content="20 Global Community Workshops."
        />
      </Head>
      <SimpleLayout
        title="IOG is partnering with community members in 20 locations around the globe."
        intro="Given importance of CIP 1694, achieving broad consensus is vital as Cardano looks to the future. To that end, IOG have joined with the community to finance and put 20 workshops around the globe cummunating with three workshops in Zug (Switzerland), Tokyo ( Japan) , and Edinburgh ( Scotland) during June and July, co-hosted by the Cardano Foundation, EMURGO, and IOG."
      >
        <div className="mb-16 space-y-40">
        <WorkshopSection title="Workshops" className="border-none">
          <p className='text-sm text-center text-zinc-400 dark:text-zinc-500'>Attend a Workshop</p>
            <div className="flex flex-row flex-wrap justify-center gap-4">                
                {whorkshops.map((workshop) => (
                  <a key={workshop.name} rel="noreferrer" target='_blank' href={workshop.link}
                      className="text-sm font-semibold text-rose-400 xl:text-xl dark:text-rose-200 hover:text-rose-600 dark:hover:text-rose-500">
                      {workshop.name}
                  </a>
                ))}
              </div>
          </WorkshopSection>
          
          <WorkshopSection title="Knowledge Base" className="border-none">
            <p className='text-sm text-center text-zinc-400 dark:text-zinc-500'>Preparing for the workshop</p>
            <Appearance
              href="https://www.youtube.com/watch?v=UMUztLQNqSI"
              target='_blank'
              title="What is Cardano and Blockchain?"
              description="Are you new to blockchain or Cardano, here is a good primer before attending the workshop."
              event="Cardano Basics"
              cta="Watch video"
            />
            <Appearance
              href="https://www.youtube.com/watch?v=fe9XvezpdbI"
              target='_blank'
              title="What is a CIP and what CIP 1694 all about?"
              description="The be the most helpful and egaged with with the workshop we recommend you read the entire CIP here on the homepage. If this is all brand new to you, here's a video give you a 10 thousand foot view before diving in."
              event="CIPs & CIP 1694"
              cta="Watch video"
            />

            <Appearance
              href={cipNutShellImage.src}
              target='_blank'
              title="CIP-1694 IN A NUTSHELL"
              description="A short infographic introduction to CIP-1694 by IOG and able-pool.io"
              event="Infographic"
              cta="Open Diagram"
            />
          </WorkshopSection>
        </div>        
      </SimpleLayout>
    </>
  )
}

export function getStaticProps() {  
  return {
      props: {
          whorkshops: [
            {
              name: 'Abu Dhabi',
              link: 'https://forms.gle/1HuKu2hB5FScg4Fm9',
              locationDescription: 'Abu Dhabi - Creative Hub (Cornish)',
              location: '309 Al Meena St - Al Zahiyah - Abu Dhabi - United Arab Emirates',
              startDateTime: '2023-06-25T16:00:00+04:00',
              endDateTime: '2023-06-23T19:00:00+04:00'
            },
            {
              name: 'Accra',
              link: 'https://www.meetup.com/cardano-blockchain-accra/events/293689905/',
              locationDescription: 'TBD',
              location: 'TBD',
              startDateTime: '2023-06-24T09:00:00+00:00',
              endDateTime: '2023-06-24T16:00:00+00:00'
            },
            {
              name: 'Bogotá',
              link: 'https://www.eventbrite.com/e/taller-de-gobernanza-cip-1694-tickets-639570842607',
              locationDescription: 'College of Higher Administration Studies - CESA',
              location: '5a-57 Diagonal 35 Bogotá, Bogotá 110311 Colombia',
              startDateTime: '2023-05-27T08:00:00-05:00',
              endDateTime: '2023-05-27T18:00:00-05:00'
            },
            {
              name: 'Chicago',
              link: 'https://docs.google.com/forms/d/e/1FAIpQLSd_s6Kex6eeo8VBZOubwFfY_dMXsNnkqkDDzf6lyo77SLjVBw/viewform',
              locationDescription: 'Hilton Garden Inn Chicago OHare Airport',
              location: '2930 S River Rd, Des Plaines, IL 60018',
              startDateTime: '2023-05-27T09:00:00-05:00',
              endDateTime: '2023-05-27T16:00:00-05:00'
            },
            {
              name: 'Fukuoka',
              link: 'https://www.meetup.com/cardano-kyushu-okinawa/events/293559858/',
              locationDescription: 'Office New Gaea Hakata Station 3F',
              location: '1-chōme-12 Hakataekihigashi, Hakata Ward, Fukuoka, 812-0013, Japan',
              startDateTime: '2023-06-10T10:00:00+09:00',
              endDateTime: '2023-06-10T17:00:00+09:00'
            },
            {
              name: 'Johannesburg',
              link: 'https://www.meetup.com/cardano-blockchain-johannesburg-sa/events/293523683/',
              locationDescription: 'UNISA Conference Centre',
              location: '2 Vinton Rd· Johannesburg South',
              startDateTime: '2023-05-25T08:00:00+02:00',
              endDateTime: '2023-05-25T15:00:00+02:00'
            },
            {
              name: 'Kyoto',
              link: 'https://www.meetup.com/cardano-blockchain-kansai/events/293559859/',
              locationDescription: 'Kyoto Chuo Gakuin, Building 2, Room 282',
              location: 'Japan, 〒600-8236 Kyoto, Shimogyo Ward, Nishiaburanokōjichō, 27',
              startDateTime: '2023-05-27T10:00:00+09:00',
              endDateTime: '2023-05-27T16:00:00+09:00'
            },
            {
              name: 'Minneapolis',
              link: 'https://www.eventbrite.com/e/cip-1694-governance-workshop-tickets-655290169537',
              locationDescription: 'Coco Working: 4th Floor Grain Exchange Building',
              location: '400 South 4th Street, Minneapolis, MN, 55415',
              startDateTime: '2023-06-23T10:00:00-05:00',
              endDateTime: '2023-06-23T17:00:00-05:00'
            },
            {
              name: 'Monterey',
              link: 'https://www.meetup.com/buffy-bot-publishing/events/293198753/',
              locationDescription: 'Monterey Marriott',
              location: '350 Calle Principal, Monterey, CA',
              startDateTime: '2023-05-28T12:00:00-07:00',
              endDateTime: '2023-05-28T18:30:00-07:00'
            },
            {
              name: 'Philadelphia',
              link: 'https://www.meetup.com/phillyada/events/293744781/',
              locationDescription: 'Blockspace Philly',
              location: '21 S 11th Street, 4th FL · Philadelphia, PA',
              startDateTime: '2023-06-17T12:00:00+04:00',
              endDateTime: '2023-06-17T17:20:00+04:00'
            },
            {
              name: 'Seoul',
              link: 'https://www.meetup.com/cardano-blockchain-korea/events/293558264/',
              locationDescription: 'Belgium',
              location: '37.508747, 127.057526',
              startDateTime: '2023-06-24T10:00:00+09:00',
              endDateTime: '2023-06-24T18:20:00+09:00'
            },
            {
              name: 'Vancouver',
              link: 'https://www.meetup.com/cardano-blockchain-vancouver-community/events/293698824/',
              locationDescription: 'Cascades Casino Delta',
              location: '6005 BC-17A, Delta, BC V4K 5B8, Canada',
              startDateTime: '2023-06-03T10:00:00+00:00',
              endDateTime: '2023-06-03T17:16:00+00:00'
            },
            {
              name: 'Worcester',
              link: 'https://www.meetup.com/gimbalabs-worcester/events/293145623/',
              locationDescription: 'Courtyard by Marriott',
              location: '72 Grove St, Worcester, MA 01605',
              startDateTime: '2023-06-08T09:00:00+04:00',
              endDateTime: '2023-06-08T18:00:00+04:00'
            },            
          ]
      },
  }
}
