'use client';

import { useEffect } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function SwaggerPage() {
  return (
    <div className="bg-white min-h-screen">
      <SwaggerUI url="/api/docs" />
    </div>
  );
}
