'use client'

import React from 'react'
import {
  ChartBarIcon,
  TrophyIcon,
  UserGroupIcon,
  ChatBubbleBottomCenterTextIcon,
  RocketLaunchIcon,
  HeartIcon,
} from '@heroicons/react/24/outline'

const features = [
  {
    name: 'Advanced Analytics',
    description:
      'Get detailed insights into your running performance with AI-powered analytics that help you understand your progress and areas for improvement.',
    icon: ChartBarIcon,
    bgColor: 'bg-blue-50',
  },
  {
    name: 'Smart Achievements',
    description:
      'Earn unique achievements tailored to your running style and goals, keeping you motivated and engaged in your fitness journey.',
    icon: TrophyIcon,
    bgColor: 'bg-green-50',
  },
  {
    name: 'Community Support',
    description:
      'Connect with fellow runners, share experiences, and participate in challenges that push you to reach new heights.',
    icon: UserGroupIcon,
    bgColor: 'bg-yellow-50',
  },
  {
    name: 'AI Coach',
    description:
      'Receive personalized training advice and real-time feedback from our AI coach to optimize your running technique and performance.',
    icon: ChatBubbleBottomCenterTextIcon,
    bgColor: 'bg-red-50',
  },
  {
    name: 'Goal Setting',
    description:
      'Set and track your running goals with our intelligent system that adapts to your progress and helps you stay on track.',
    icon: RocketLaunchIcon,
    bgColor: 'bg-purple-50',
  },
  {
    name: 'Health Monitoring',
    description:
      'Monitor your health metrics and receive recommendations to maintain optimal running conditions and prevent injuries.',
    icon: HeartIcon,
    bgColor: 'bg-pink-50',
  },
]

export function Features() {
  return (
    <div className="bg-white py-24 sm:py-32" id="features">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Run Smarter</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to elevate your running experience
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            RunConnect combines cutting-edge AI technology with proven training methods to help you achieve your running goals.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className={`${feature.bgColor} rounded-lg p-2`}>
                    <feature.icon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
} 