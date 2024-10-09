import { useScreenDimension } from '@/hooks';
import { convertString } from '@/lib';
import Link from 'next/link';
import React from 'react';
import BreadCrumbSeparator from '../atoms/svgs/BreadCrumbSeparator';
import HomeIcon from '../atoms/svgs/HomeIcon';

type BreadCrumbsProps = {
  crumbs?: {
    label: string;
    href?: string;
  }[];
};

function BreadCrumbs({ crumbs }: BreadCrumbsProps) {
  const { isMobile, screenWidth } = useScreenDimension();

  return (
    <nav aria-label="Breadcrumb" className="w-full border-b border-gray-300 shadow">
      <div className="base_container">
        <ol className="inline-flex items-center space-x-1 px-1 py-2 md:space-x-2 rtl:space-x-reverse ">
          <li className="inline-flex items-center">
            {crumbs?.length > 0 ? (
              <Link
                href="/"
                className="inline-flex items-center text-sm font-medium text-black hover:text-orange-500"
              >
                <HomeIcon />
                CIP 1694
              </Link>
            ) : (
              <span className="inline-flex items-center text-sm font-light text-orange-500">
                <HomeIcon />
                CIP 1694
              </span>
            )}
          </li>
          {crumbs?.length > 0 &&
            crumbs.map((crumb, index) => {
              const isLastCrumb = index === crumbs.length - 1;
              return (
                <li key={index}>
                  <div className="flex items-center">
                    <BreadCrumbSeparator />
                    {isLastCrumb ? (
                      <span className="ms-1 text-sm font-light text-orange-500 md:ms-2">
                        {crumb.label.length > 10
                          ? convertString(
                              crumb.label,
                              isMobile || screenWidth < 1024,
                            )
                          : crumb.label}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="ms-1 text-sm font-medium text-black hover:text-orange-500 md:ms-2"
                      >
                        {crumb.label.length > 10
                          ? convertString(
                              crumb.label,
                              isMobile || screenWidth < 1024,
                            )
                          : crumb.label}
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
        </ol>
      </div>
    </nav>
  );
}

export default BreadCrumbs;
