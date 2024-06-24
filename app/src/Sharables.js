import React, { useState, useEffect } from 'react';
import {
  FacebookShareButton,
  FacebookIcon,
  TwitterShareButton,
  XIcon,
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
  const [msg, setMsg] = useState(null);

  // close modal via the dom
  function closeModal() {
    document.getElementById('modal').style.display = 'none';
  }

  function copyToClipboard() {
    /* Get the text field */
    var copyText = shareUrl

    /* Select the text field */
    copyText.select();
    copyText.setSelectionRange(0, 99999); /* For mobile devices */

    /* Copy the text inside the text field */
    document.execCommand('copy');

    /* Alert the copied text */
    alert('URL copied to clipboard');
  }

  useEffect(() => {
    // fetch the art id from the session:
    fetch('/api/session')
      .then((res) => res.json())
      .then((session) => {
        if (session.artId) {
          // add 2 line breaks after BritePegs.com
          setMsg(
            `Check out what I made on BritePegs.com: ${window.location.origin}/art/${session.artId}`
          );
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
          <FacebookShareButton url={msg}>
            <FacebookIcon size={32} round />
          </FacebookShareButton>
          <TwitterShareButton url={msg}>
            <XIcon size={32} round />
          </TwitterShareButton>
          <LinkedinShareButton url={msg}>
            <LinkedinIcon size={32} round />
          </LinkedinShareButton>
          <WhatsappShareButton url={msg}>
            <WhatsappIcon size={32} round />
          </WhatsappShareButton>
          <TelegramShareButton url={msg}>
            <TelegramIcon size={32} round />
          </TelegramShareButton>
          <PinterestShareButton url={msg}>
            <PinterestIcon size={32} round />
          </PinterestShareButton>
          <RedditShareButton url={msg}>
            <RedditIcon size={32} round />
          </RedditShareButton>
          <EmailShareButton url={msg}>
            <EmailIcon size={32} round />
          </EmailShareButton>
          <TumblrShareButton url={msg}>
            <TumblrIcon size={32} round />
          </TumblrShareButton>
          <VKShareButton url={msg}>
            <VKIcon size={32} round />
          </VKShareButton>
          <OKShareButton url={msg}>
            <OKIcon size={32} round />
          </OKShareButton>
          <InstapaperShareButton url={msg}>
            <InstapaperIcon size={32} round />
          </InstapaperShareButton>
          <PocketShareButton url={msg}>
            <PocketIcon size={32} round />
          </PocketShareButton>
          <ViberShareButton url={msg}>
            <ViberIcon size={32} round />
          </ViberShareButton>
          <WorkplaceShareButton url={msg}>
            <WorkplaceIcon size={32} round />
          </WorkplaceShareButton>
          <LineShareButton url={msg}>
            <LineIcon size={32} round />
          </LineShareButton>
          <WeiboShareButton url={msg}>
            <WeiboIcon size={32} round />
          </WeiboShareButton>
          <LivejournalShareButton url={msg}>
            <LivejournalIcon size={32} round />
          </LivejournalShareButton>
          <MailruShareButton url={msg}>
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
        <input 
        type="text" 
        className="url-text-input"
        style={
          { 
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            marginBottom: '10px',
            marginTop: '10px',
            border: '1px solid black',
            borderRadius: '5px',
            fontFamily: 'courier'
          }
        } 
        value={shareUrl}
        onInput={(e) => setShareUrl(e.target.value)}
        readOnly 
      />
        <button 
          id="copy-button"
          onClick={copyToClipboard}>
          <a className='emoji' 
          role='img' 
          aria-label='clipboard'
          > 📋
          </a> Copy
          </button>
      </header>
    </div>
  );
}

export default Sharables;
