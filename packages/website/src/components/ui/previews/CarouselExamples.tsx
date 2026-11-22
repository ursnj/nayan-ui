'use client';

import { useState } from 'react';
import { NButton, NCarousel, NImage, NText, NView } from 'nayan-ui/components';
import { componentSource } from '@/services/nayan-ui/component-examples';
import { scenario } from './scenario';

const slides = [
  { photo: '1470770841072-f978cf4d019e', title: 'Alpine lake', caption: 'A quiet mountain escape.' },
  { photo: '1473448912268-2022ce9509d8', title: 'Forest trail', caption: 'Take the scenic route through the trees.' },
  { photo: '1507525428034-b723cf961d3e', title: 'Coastal morning', caption: 'Follow the shoreline at your own pace.' }
];
const height = 288;
const indicatorInset = 20;
const slideClass = 'relative w-full gap-0 rounded-xl bg-surface-secondary';
const imageClass = 'w-full rounded-xl';
const backdropClass = 'absolute inset-x-0 bottom-0 h-44 rounded-b-xl bg-linear-to-t from-black/95 to-transparent';
const captionClass = 'absolute inset-x-0 bottom-9 items-center gap-1 px-4';
const titleClass = 'text-center text-xl font-semibold text-white';
const descriptionClass = 'text-center text-sm text-white';
const photoUrl = (photo: string) => `https://images.unsplash.com/photo-${photo}?auto=format&fit=crop&w=800&h=560&q=78`;

function PhotoCarousel({ controlled = false }: { controlled?: boolean }) {
  const [index, setIndex] = useState(0);
  return (
    <>
      <NCarousel
        height={height}
        indicatorPlacement="overlay"
        indicatorInset={indicatorInset}
        indicatorColor="#fff"
        value={controlled ? index : undefined}
        onValueChange={controlled ? setIndex : undefined}
      >
        {slides.map(({ photo, title, caption }) => (
          <NView height={height} className={slideClass} key={photo}>
            <NImage src={photoUrl(photo)} alt={title} height={height} className={imageClass} contentFit="cover" />
            <NView className={backdropClass} />
            <NView className={captionClass}>
              <NText className={titleClass}>{title}</NText>
              <NText className={descriptionClass}>{caption}</NText>
            </NView>
          </NView>
        ))}
      </NCarousel>
      {controlled && (
        <NButton isOutline onPress={() => setIndex((index + 1) % slides.length)}>
          Next slide
        </NButton>
      )}
    </>
  );
}

const imports = 'NCarousel, NImage, NText, NView';
const data = `const slides = ${JSON.stringify(slides, null, 2)};`;
function carouselSource(controlled: boolean) {
  return `<NCarousel height={${height}} indicatorPlacement="overlay" indicatorInset={${indicatorInset}} indicatorColor="#fff"${controlled ? ' value={index} onValueChange={setIndex}' : ''}>
            {slides.map(({ photo, title, caption }) => (
              <NView height={${height}} className="${slideClass}" key={photo}>
                <NImage
                  src={\`${photoUrl('${photo}')}\`}
                  alt={title} height={${height}} className="${imageClass}" contentFit="cover"
                />
                <NView className="${backdropClass}" />
                <NView className="${captionClass}">
                  <NText className="${titleClass}">{title}</NText>
                  <NText className="${descriptionClass}">{caption}</NText>
                </NView>
              </NView>
            ))}
          </NCarousel>`;
}

export const carouselOverview = {
  height: 340,
  render: <PhotoCarousel />,
  source: componentSource(imports, carouselSource(false), data, 340)
};

export const controlledCarousel = scenario(
  'Advance with a button',
  `${imports}, NButton`,
  `${carouselSource(true)}
          <NButton isOutline onPress={() => setIndex((index + 1) % slides.length)}>Next slide</NButton>`,
  <PhotoCarousel controlled />,
  `${data}\n  const [index, setIndex] = useState(0);`,
  400
);
