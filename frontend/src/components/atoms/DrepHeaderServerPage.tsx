// src/app/[locale]/dreps/ServerPage.js
import { headers, type UnsafeUnwrappedHeaders } from 'next/headers';
import React from 'react';

const ServerPage = ({ children }) => {
    const headersList = (headers() as unknown as UnsafeUnwrappedHeaders);
    const redirectCause = headersList.get('x-status-reason');
    return (
        <div>
            {React.cloneElement(children, { redirectCause })}
        </div>
    );
};

export default ServerPage;
