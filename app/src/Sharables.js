import React, { useState, useEffect } from 'react';
import {
  FacebookShareButton,
  FacebookIcon,
  TwitterShareButton,
  TwitterIcon,
  LinkedinShareButton,
  LinkedinIcon,
  WhatsappShareButton,
  WhatsappIcon,
  TelegramShareButton,
  TelegramIcon,
  PinterestShareButton,
  PinterestIcon,
  RedditShareButton,
  RedditIcon,
  EmailShareButton,
  EmailIcon,
  TumblrShareButton,
  TumblrIcon,
  VKShareButton,
  VKIcon,
  OKShareButton,
  OKIcon,
  InstapaperShareButton,
  InstapaperIcon,
  PocketShareButton,
  PocketIcon,
  ViberShareButton,
  ViberIcon,
  WorkplaceShareButton,
  WorkplaceIcon,
  LineShareButton,
  LineIcon,
  WeiboShareButton,
  WeiboIcon,
  LivejournalShareButton,
  LivejournalIcon,
  MailruShareButton,
  MailruIcon,
} from 'react-share';

function Sharables() {
  const [shareUrl, setShareUrl] = useState(null);

  // close modal via the dom
  function closeModal() {
    document.getElementById('modal').style.display = 'none';
  }

  useEffect(() => {
    // fetch the art id from the session:
    fetch('/api/session')
      .then((res) => res.json())
      .then((session) => {
        if (session.artId) {
          setShareUrl(`${window.location.origin}/art/${session.artId}`);
        }
      });
  }, []);


  if (!shareUrl) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="share-buttons">
          <FacebookShareButton url={shareUrl}>
            <FacebookIcon size={32} round />
          </FacebookShareButton>
          <TwitterShareButton url={shareUrl}>
            <TwitterIcon size={32} round />
          </TwitterShareButton>
          <LinkedinShareButton url={shareUrl}>
            <LinkedinIcon size={32} round />
          </LinkedinShareButton>
          <WhatsappShareButton url={shareUrl}>
            <WhatsappIcon size={32} round />
          </WhatsappShareButton>
          <TelegramShareButton url={shareUrl}>
            <TelegramIcon size={32} round />
          </TelegramShareButton>
          <PinterestShareButton url={shareUrl}>
            <PinterestIcon size={32} round />
          </PinterestShareButton>
          <RedditShareButton url={shareUrl}>
            <RedditIcon size={32} round />
          </RedditShareButton>
          <EmailShareButton url={shareUrl}>
            <EmailIcon size={32} round />
          </EmailShareButton>
          <TumblrShareButton url={shareUrl}>
            <TumblrIcon size={32} round />
          </TumblrShareButton>
          <VKShareButton url={shareUrl}>
            <VKIcon size={32} round />
          </VKShareButton>
          <OKShareButton url={shareUrl}>
            <OKIcon size={32} round />
          </OKShareButton>
          <InstapaperShareButton url={shareUrl}>
            <InstapaperIcon size={32} round />
          </InstapaperShareButton>
          <PocketShareButton url={shareUrl}>
            <PocketIcon size={32} round />
          </PocketShareButton>
          <ViberShareButton url={shareUrl}>
            <ViberIcon size={32} round />
          </ViberShareButton>
          <WorkplaceShareButton url={shareUrl}>
            <WorkplaceIcon size={32} round />
          </WorkplaceShareButton>
          <LineShareButton url={shareUrl}>
            <LineIcon size={32} round />
          </LineShareButton>
          <WeiboShareButton url={shareUrl}>
            <WeiboIcon size={32} round />
          </WeiboShareButton>
          <LivejournalShareButton url={shareUrl}>
            <LivejournalIcon size={32} round />
          </LivejournalShareButton>
          <MailruShareButton url={shareUrl}>
            <MailruIcon size={32} round />
          </MailruShareButton>
          {/* close modal: */}
          {/* float close icon to thne right */}
          {/* <button onClick={closeModal} style={{ float: 'right' }}>
            Close
          </button> */}
          {/* make this more of a link */}
          <a href="#" onClick={closeModal} style={{ float: 'right', color: 'black', fontSize: '24px' }}> 
            &times;
          </a>
        </div>
      </header>
    </div>
  );
}

export default Sharables;
