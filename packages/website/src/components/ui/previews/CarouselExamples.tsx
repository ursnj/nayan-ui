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
const height = 300;
const slideClass = 'h-64 w-full gap-0 rounded-xl border border-border bg-surface';
const imageClass = 'h-44 w-full rounded-t-xl bg-surface-secondary';
const captionClass = 'gap-1 p-3';
const photoUrl = (photo: string) => `https://images.unsplash.com/photo-${photo}?auto=format&fit=crop&w=800&h=400&q=78`;

function PhotoCarousel({ controlled = false }: { controlled?: boolean }) {
  const [index, setIndex] = useState(0);
  return (
    <>
      <NCarousel height={height} indicatorPlacement="below" value={controlled ? index : undefined} onValueChange={controlled ? setIndex : undefined}>
        {slides.map(({ photo, title, caption }) => (
          <NView className={slideClass} key={photo}>
            <NImage src={photoUrl(photo)} alt={title} className={imageClass} contentFit="cover" />
            <NView className={captionClass}>
              <NText className="font-semibold">{title}</NText>
              <NText className="text-sm text-muted">{caption}</NText>
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
  return `<NCarousel height={${height}} indicatorPlacement="below"${controlled ? ' value={index} onValueChange={setIndex}' : ''}>
            {slides.map(({ photo, title, caption }) => (
              <NView className="${slideClass}" key={photo}>
                <NImage
                  src={\`https://images.unsplash.com/photo-\${photo}?auto=format&fit=crop&w=800&h=400&q=78\`}
                  alt={title} className="${imageClass}" contentFit="cover"
                />
                <NView className="${captionClass}">
                  <NText className="font-semibold">{title}</NText>
                  <NText className="text-sm text-muted">{caption}</NText>
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
