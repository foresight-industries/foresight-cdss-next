import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QueueData {
  title: string;
  count: number;
  href: string;
  linkText: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  linkColor: string;
}

interface ActionableQueuesProps {
  queueData: QueueData[];
}

export function ActionableQueues({ queueData }: ActionableQueuesProps) {
  return (
    <Card className="bg-white p-6 border shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Actionable Queues</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {queueData.map((queue, index) => (
          <div
            key={index}
            className={`p-4 ${queue.bgColor} ${queue.borderColor} border rounded-lg text-center`}
          >
            <h4 className="font-semibold text-sm mb-2">{queue.title}</h4>
            <p className={`text-3xl font-bold ${queue.textColor} my-2`}>
              {queue.count}
            </p>
            <Link href={queue.href}>
              <Button
                variant="ghost"
                size="sm"
                className={`text-sm font-medium ${queue.linkColor} hover:underline p-0 h-auto`}
              >
                {queue.linkText} →
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function getDefaultQueueData(): QueueData[] {
  return [
    {
      title: 'ePA — To Submit',
      count: 3,
      href: '/queue',
      linkText: 'Open Queue',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-700',
      linkColor: 'text-indigo-800'
    },
    {
      title: 'ePA — Pending',
      count: 1,
      href: '/queue',
      linkText: 'Track',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      linkColor: 'text-yellow-800'
    },
    {
      title: 'Claims — Ready',
      count: 2,
      href: '/claims',
      linkText: 'Submit',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-700',
      linkColor: 'text-emerald-800'
    },
    {
      title: 'ERA Denials',
      count: 2,
      href: '/claims',
      linkText: 'Work',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      linkColor: 'text-red-800'
    }
  ];
}