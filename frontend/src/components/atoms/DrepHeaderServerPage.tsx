// src/app/[locale]/dreps/ServerPage.js
import { headers } from 'next/headers';
import React from 'react';

const ServerPage = async ({ children }) => {
    const headersList = await headers();
    const redirectCause = headersList.get('x-status-reason');
    return (
        <div>
            {React.cloneElement(children, { redirectCause })}
        </div>
    );
};

export default ServerPage;
