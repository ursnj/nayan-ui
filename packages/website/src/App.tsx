import { Navigate, Route, Routes } from 'react-router-dom';
import { NTheme, THEMES, useLocalStorage } from '@nayan-ui/react';
import Contributions from './contributions/Contributions';
import Devtools from './devtools/Devtools';
import RobotsPage from './devtools/RobotsPage';
import SitemapPage from './devtools/SitemapPage';
import GamesApiReference from './games/ApiReference';
import Games from './games/Games';
import GamesInstallation from './games/Installation';
import Wrapper from './helpers/Wrapper';
import Home from './home/Home';
// React Native imports
import RNAccordion from './react-native/components/Accordion';
import RNAlert from './react-native/components/Alert';
import RNBadge from './react-native/components/Badge';
import RNButton from './react-native/components/Button';
import RNButtonGroup from './react-native/components/ButtonGroup';
import RNCard from './react-native/components/Card';
import RNCheckbox from './react-native/components/Checkbox';
import RNConfirmAlert from './react-native/components/ConfirmAlert';
import RNDialog from './react-native/components/Dialog';
import RNDivider from './react-native/components/Divider';
import RNFormInput from './react-native/components/FormInput';
import RNInput from './react-native/components/Input';
import RNLink from './react-native/components/Link';
import RNLinkify from './react-native/components/Linkify';
import RNLoading from './react-native/components/Loading';
import RNMenu from './react-native/components/Menu';
import RNPopover from './react-native/components/Popover';
import RNProgress from './react-native/components/Progress';
import RNRadioGroup from './react-native/components/RadioGroup';
import RNSelect from './react-native/components/Select';
import RNSheet from './react-native/components/Sheet';
import RNSkeleton from './react-native/components/Skeleton';
import RNSlider from './react-native/components/Slider';
import RNSwitch from './react-native/components/Switch';
import RNTabs from './react-native/components/Tabs';
import RNTextarea from './react-native/components/Textarea';
import RNToast from './react-native/components/Toast';
import RNTooltip from './react-native/components/Tooltip';
import RNInstallation from './react-native/installation/Installation';
import Accordion from './react/components/Accordion';
import Alert from './react/components/Alert';
import Badge from './react/components/Badge';
import Button from './react/components/Button';
import ButtonGroup from './react/components/ButtonGroup';
import Card from './react/components/Card';
import Checkbox from './react/components/Checkbox';
import Components from './react/components/Components';
import ConfirmAlert from './react/components/ConfirmAlert';
import Dialog from './react/components/Dialog';
import Divider from './react/components/Divider';
import FormInput from './react/components/FormInput';
import InfiniteScroll from './react/components/InfiniteScroll';
import Input from './react/components/Input';
import Link from './react/components/Link';
import Linkify from './react/components/Linkify';
import Loading from './react/components/Loading';
import Menu from './react/components/Menu';
import Popover from './react/components/Popover';
import Progress from './react/components/Progress';
import RadioGroup from './react/components/RadioGroup';
import Select from './react/components/Select';
import Sheet from './react/components/Sheet';
import Skeleton from './react/components/Skeleton';
import Slider from './react/components/Slider';
import Switch from './react/components/Switch';
import Table from './react/components/Table';
import Tabs from './react/components/Tabs';
import Textarea from './react/components/Textarea';
import Toast from './react/components/Toast';
import Tooltip from './react/components/Tooltip';
import Installation from './react/installation/Installation';
import Tags from './tags/Tags';
import TagsDetails from './tags/TagsDetails';

const App = () => {
  const [theme] = useLocalStorage('THEME', THEMES.LIGHT);

  return (
    <NTheme theme={theme}>
      <Wrapper>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tags" element={<Tags />} />
          <Route path="/contributions" element={<Contributions />} />

          <Route path="/devtools">
            <Route index element={<Devtools />} />
            <Route path="sitemap" element={<SitemapPage />} />
            <Route path="robots" element={<RobotsPage />} />
          </Route>

          <Route path="/games">
            <Route index element={<Games />} />
            <Route path="installation" element={<GamesInstallation />} />
            <Route path="api-reference" element={<GamesApiReference />} />
          </Route>
          <Route path="/react">
            <Route index element={<Components />} />
            <Route path="components" element={<Components />} />
            <Route path="installation" element={<Installation />} />
            <Route path="accordion" element={<Accordion />} />
            <Route path="alert" element={<Alert />} />
            <Route path="badge" element={<Badge />} />
            <Route path="button" element={<Button />} />
            <Route path="button-group" element={<ButtonGroup />} />
            <Route path="card" element={<Card />} />
            <Route path="checkbox" element={<Checkbox />} />
            <Route path="confirm-alert" element={<ConfirmAlert />} />
            <Route path="dialog" element={<Dialog />} />
            <Route path="divider" element={<Divider />} />
            <Route path="infinite-scroll" element={<InfiniteScroll />} />
            <Route path="input" element={<Input />} />
            <Route path="input-hook-form" element={<FormInput />} />
            <Route path="link" element={<Link />} />
            <Route path="linkify" element={<Linkify />} />
            <Route path="loading" element={<Loading />} />
            <Route path="menu" element={<Menu />} />
            <Route path="popover" element={<Popover />} />
            <Route path="progress" element={<Progress />} />
            <Route path="radio-group" element={<RadioGroup />} />
            <Route path="select" element={<Select />} />
            <Route path="sheet" element={<Sheet />} />
            <Route path="skeleton" element={<Skeleton />} />
            <Route path="slider" element={<Slider />} />
            <Route path="switch" element={<Switch />} />
            <Route path="table" element={<Table />} />
            <Route path="tabs" element={<Tabs />} />
            <Route path="textarea" element={<Textarea />} />
            <Route path="toast" element={<Toast />} />
            <Route path="tooltip" element={<Tooltip />} />

            <Route path="tags">
              <Route index element={<Tags />} />
              <Route path=":tag" element={<TagsDetails />} />
            </Route>
          </Route>

          <Route path="/react-native">
            <Route index element={<Components />} />
            <Route path="components" element={<Components />} />
            <Route path="installation" element={<RNInstallation />} />
            <Route path="accordion" element={<RNAccordion />} />
            <Route path="alert" element={<RNAlert />} />
            <Route path="badge" element={<RNBadge />} />
            <Route path="button" element={<RNButton />} />
            <Route path="button-group" element={<RNButtonGroup />} />
            <Route path="card" element={<RNCard />} />
            <Route path="checkbox" element={<RNCheckbox />} />
            <Route path="confirm-alert" element={<RNConfirmAlert />} />
            <Route path="dialog" element={<RNDialog />} />
            <Route path="divider" element={<RNDivider />} />
            <Route path="input" element={<RNInput />} />
            <Route path="input-hook-form" element={<RNFormInput />} />
            <Route path="link" element={<RNLink />} />
            <Route path="linkify" element={<RNLinkify />} />
            <Route path="loading" element={<RNLoading />} />
            <Route path="menu" element={<RNMenu />} />
            <Route path="popover" element={<RNPopover />} />
            <Route path="progress" element={<RNProgress />} />
            <Route path="radio-group" element={<RNRadioGroup />} />
            <Route path="select" element={<RNSelect />} />
            <Route path="sheet" element={<RNSheet />} />
            <Route path="skeleton" element={<RNSkeleton />} />
            <Route path="slider" element={<RNSlider />} />
            <Route path="switch" element={<RNSwitch />} />
            <Route path="tabs" element={<RNTabs />} />
            <Route path="textarea" element={<RNTextarea />} />
            <Route path="toast" element={<RNToast />} />
            <Route path="tooltip" element={<RNTooltip />} />

            <Route path="tags">
              <Route index element={<Tags />} />
              <Route path=":tag" element={<TagsDetails />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Wrapper>
    </NTheme>
  );
};

export default App;
