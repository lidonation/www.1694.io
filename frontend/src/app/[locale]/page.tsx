'use client';
import { Background } from '@/components/atoms/Background';
import CIPInfo from '@/components/1694.io/1694Info';
import React, { useEffect, useState } from 'react';
import CIPIntro from '@/components/1694.io/1694Intro';
import CIPMotivationInfo from '@/components/1694.io/1694MotivationInfo';
import ConversationsCard from '@/components/1694.io/ConversationsCard';
import CIPSpecifications from '@/components/1694.io/1694Specifications';
import CIPDRepInfo from '@/components/1694.io/1694DRepInfo';
import CIPGovernanceActions from '@/components/1694.io/1694GovernanceActions';
import CIPRationale from '@/components/1694.io/1694Rationale';
import CIPChangelog from '@/components/1694.io/1694Changelog';
import CIPPathtoactive from '@/components/1694.io/1694Pathtoactive';
import CIPAcknowledgments from '@/components/1694.io/1694Acknowledgments';
import { Header } from '@/components/atoms/Header';
import Footer from '@/components/atoms/Footer';
import TableOfContents from '../../components/molecules/table-of-contents';
import CopyRight from '@/components/1694.io/CopyRight';
import ScrollToTop from '@/components/atoms/ScrollToTop';
import TranslationBlock from '@/components/1694.io/TranslationBlock';
import GovernanceLifecycle from '../../components/molecules/Lifecycle';

const Page = () => {
  const [raw, setRaw] = useState(null);
  const [comments, setComments] = useState(null);
  useEffect(() => {
    async function fetchMarkdown() {
      try {
        const [cipResult, commentsResult] = await Promise.allSettled([
          fetch(
            'https://raw.githubusercontent.com/cardano-foundation/CIPs/master/CIP-1694/README.md',
          ).then((res) => res.text()),
          fetch(
            'https://api.github.com/repos/cardano-foundation/CIPs/issues/380/comments',
          ).then((res) => res.json()),
        ]);

        if (cipResult.status === 'fulfilled') {
          setRaw(cipResult.value);
        }

        if (commentsResult.status === 'fulfilled') {
          setComments(
            Array.isArray(commentsResult.value) ? commentsResult.value : [],
          );
        }
      } catch (error) {
        console.error('Error fetching Markdown:', error);
      }
    }

    fetchMarkdown();
  }, []);

  return (
    <div className="w-full bg-[url(/img/1694-asset-1.png)] bg-auto bg-right-top bg-no-repeat">
      <Background>
        <Header />
        <TableOfContents />
        {/* Disabled till further notice */}
        {/* <TranslationBlock/> */}
        <ScrollToTop />
        <div id="intro"><CIPIntro /></div>
        <div id="lifecycle" className="base_container py-12">
          <GovernanceLifecycle />
        </div>
        <div id="summary"><CIPInfo /></div>
        <div id="motivation"><CIPMotivationInfo /></div>
        <ConversationsCard conversations={comments} />
        <div id="specifications"><CIPSpecifications /></div>
        <div id="dreps"><CIPDRepInfo /></div>
        <div id="governance-actions"><CIPGovernanceActions /></div>
        <div id="rationale"><CIPRationale /></div>
        <div id="changelog"><CIPChangelog /></div>
        <div id="path-to-active"><CIPPathtoactive /></div>
        <div id="acknowledgments"><CIPAcknowledgments /></div>
        <CopyRight />
        <Footer />
      </Background>
    </div>
  );
};

export default Page;
