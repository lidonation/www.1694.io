import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import clsx from 'clsx'
import {Card} from '@/components/Card'
import {Container} from '@/components/Container'
import {GitHubIcon} from '@/components/SocialIcons'
import image1 from '@/images/photos/image-1.jpg'
import image2 from '@/images/photos/image-2.jpg'
import image3 from '@/images/photos/image-3.jpg'
import image4 from '@/images/photos/image-4.jpg'
import image5 from '@/images/photos/image-5.jpg'
import {formatDate} from '@/lib/formatDate'
// import {getAllArticles} from '@/lib/getAllArticles'
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

function MailIcon(props) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            <path
                d="M2.75 7.75a3 3 0 0 1 3-3h12.5a3 3 0 0 1 3 3v8.5a3 3 0 0 1-3 3H5.75a3 3 0 0 1-3-3v-8.5Z"
                className="fill-zinc-100 stroke-zinc-400 dark:fill-zinc-100/10 dark:stroke-zinc-500"
            />
            <path
                d="m4 6 6.024 5.479a2.915 2.915 0 0 0 3.952 0L20 6"
                className="stroke-zinc-400 dark:stroke-zinc-500"
            />
        </svg>
    )
}

function BriefcaseIcon(props) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            <path
                d="M2.75 9.75a3 3 0 0 1 3-3h12.5a3 3 0 0 1 3 3v8.5a3 3 0 0 1-3 3H5.75a3 3 0 0 1-3-3v-8.5Z"
                className="fill-zinc-100 stroke-zinc-400 dark:fill-zinc-100/10 dark:stroke-zinc-500"
            />
            <path
                d="M3 14.25h6.249c.484 0 .952-.002 1.316.319l.777.682a.996.996 0 0 0 1.316 0l.777-.682c.364-.32.832-.319 1.316-.319H21M8.75 6.5V4.75a2 2 0 0 1 2-2h2.5a2 2 0 0 1 2 2V6.5"
                className="stroke-zinc-400 dark:stroke-zinc-500"
            />
        </svg>
    )
}

function ArrowDownIcon(props) {
    return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
            <path
                d="M4.75 8.75 8 12.25m0 0 3.25-3.5M8 12.25v-8.5"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function Article({article}) {
    return (
        <Card as="article">
            <Card.Title href={`/articles/${article.slug}`}>
                {article.title}
            </Card.Title>
            <Card.Eyebrow as="time" dateTime={article.date} decorate>
                {formatDate(article.date)}
            </Card.Eyebrow>
            <Card.Description>{article.description}</Card.Description>
            <Card.Cta>Read article</Card.Cta>
        </Card>
    )
}

function SocialLink({icon: Icon, ...props}) {
    return (
        <Link className="p-1 -m-1 group" {...props}>
            <Icon
                className="w-6 h-6 transition fill-zinc-500 group-hover:fill-zinc-600 dark:fill-zinc-400 dark:group-hover:fill-zinc-300"/>
        </Link>
    )
}

function Photos() {
    let rotations = ['rotate-2', '-rotate-2', 'rotate-2', 'rotate-2', '-rotate-2']

    return (
        <div className="mt-16 sm:mt-20">
            <div className="flex justify-center gap-5 py-4 -my-4 overflow-hidden sm:gap-8">
                {[image1, image2, image3, image4, image5].map((image, imageIndex) => (
                    <div
                        key={image.src}
                        className={clsx(
                            'relative aspect-[9/10] w-44 flex-none overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 sm:w-72 sm:rounded-2xl',
                            rotations[imageIndex % rotations.length]
                        )}
                    >
                        <Image
                            src={image}
                            alt=""
                            sizes="(min-width: 640px) 18rem, 11rem"
                            className="absolute inset-0 object-cover w-full h-full"
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function Home({comments, cip}) {
    return (
        <>
            <Head>
                <title>
                    CIP 1694 - An On-Chain Decentralized Governance Mechanism for Voltaire
                </title>
                <meta
                    name="description"
                    content="CIP 1694 is a Cardano Improvement Proposal to reason about An On-Chain Decentralized Governance Mechanism for Cardano Voltaire era."
                />
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
            </Head>
            <Container className="mt-9">
                <div className="max-w-2xl text-zinc-800 dark:text-zinc-200">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                        CIP 1694 - An On-Chain Decentralized Governance Mechanism for Voltaire
                    </h1>
                    <div className="abstract-wrapper">
                        <p className="mt-6 text-base abstract">
                            <b className="inline mr-2">Abstract</b>
                            We propose a revision of Cardano&apos;s on-chain governance system to support the new requirements for Voltaire.
                            The existing specialized governance support for protocol parameter updates and MIR certificates will be deprecated,
                            and two new fields will be added to normal transaction bodies: <b>governance actions</b>, <b>votes</b>.
                        </p>
                    </div>
                    <div className="flex gap-6 mt-6">
                        <SocialLink
                            target="_blank"  rel="noreferrer"
                            href="https://github.com/cardano-foundation/CIPs/pull/380"
                            title="Join the conversation on GitHub"
                            aria-label="Join the conversation on GitHub"
                            icon={GitHubIcon}
                        />
                    </div>
                </div>
            </Container>
            <Photos/>
            <Container className="w-full mt-24 overflow-x-hidden md:mt-28 text-zinc-800 dark:text-zinc-200">
                <div className="grid max-w-xl grid-cols-1 mx-auto gap-y-20 lg:max-w-none lg:grid-cols-5">
                    <div className="flex flex-col w-full gap-3 p-2 lg:col-span-3 cip-wrapper">
                        {// eslint-disable-next-line
                        }<ReactMarkdown children={cip} remarkPlugins={[remarkGfm]} />
                    </div>
                    <div className="p-2 lg:col-span-2 lg:pl-8 xl:pl-20 conversations">
                        <div className='sticky flex flex-col space-y-8 top-8'>                        
                            <h2 className="text-xl font-semibold xl:text-2xl">Conversations</h2>
                            <p>Join the conversation on Github</p>
                            <a rel="noreferrer" target='_blank' href="https://github.com/cardano-foundation/CIPs/pull/380#issue-comment-box"
                                type="button" 
                                className="rounded-md bg-zinc-800 text-zinc-100 dark:bg-rose-100 py-2.5 px-3.5 text-center text-sm xl:text-xl font-semibold dark:text-zinc-600 shadow-sm w-full hover:bg-rose-100">
                                Leave a Comment
                            </a>





                            <div className="w-full">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="flex flex-col items-start justify-between max-w-xl pb-8 mb-4 overflow-x-auto border-b">
                                        <div className="relative group">
                                            {// eslint-disable-next-line
                                            }<ReactMarkdown children={comment.body} remarkPlugins={[remarkGfm]} />
                                            {/*<p className="mt-5 text-sm leading-6 line-clamp-3">*/}
                                            {/*    {comment.body}*/}
                                            {/*</p>*/}
                                        </div>
                                        <div className="flex items-center mt-4 text-xs gap-x-4">
                                            <time dateTime={comment.created_at} className="text-gray-500">
                                                {comment.created_at}
                                            </time>
                                            <a
                                                target="_blank"  rel="noreferrer"
                                                href={comment.html_url}
                                                className="relative z-10 text-xs rounded-md bg-gray-50 py-0.5 px-2 font-medium text-gray-600 hover:bg-gray-100"
                                            >
                                                view on Github
                                            </a>
                                        </div>
                                        <div className="relative flex items-center mt-8 gap-x-4">
                                            <Image src={comment.user.avatar_url} alt="User avatar" className="w-10 h-10 rounded-full bg-gray-50" />
                                            <div className="text-sm leading-6">
                                                <p className="mt-0 font-semibold">
                                                    <a target="_blank"  rel="noreferrer" href={comment.user.html_url}>
                                                        <span className="absolute inset-0" />
                                                        {comment.user.login}
                                                    </a>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>






                        </div>           
                    </div>
                </div>
            </Container>
        </>
    )
}

export async function getStaticProps() {
    const cip = await (
        await fetch('https://raw.githubusercontent.com/cardano-foundation/CIPs/3a0d2824fe502a8593d63bbf00bf8d9a7b5cbdeb/CIP-1694/README.md')
    ).text()
    const comments = await (
        await fetch('https://api.github.com/repos/cardano-foundation/CIPs/issues/380/comments')
    ).json()
    // console.log({comments})
    return {
        props: {
            cip,
            comments
        },
    }
}
