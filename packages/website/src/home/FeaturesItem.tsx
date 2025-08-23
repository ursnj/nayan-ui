interface Props {
  title: string;
  text: string;
  icon: any;
}

const FeaturesItem = (props: Props) => {
  const Icon = props.icon;
  return (
    <div className="col-span-1 justify-center">
      <div className="text-base text mb-2 flex">
        <span className="mr-3 text-primary">
          <Icon size="1.3em" />
        </span>
        <span className="font-medium">{props.title}</span>
      </div>
      <div className="text-sm text leading-relaxed">{props.text}</div>
    </div>
  );
};

export default FeaturesItem;
