import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import buildspaceLogo from '../assets/buildspace-logo.png';

const Home = () => {
  // create state properties
  const [input, setInput] = useState('');
  const [img, setImg] = useState('');

  // retries
  const maxRetries = 20; // max
  const [retry, setRetry] = useState(0); // time until model loads
  const [retryCount, setRetryCount] = useState(maxRetries); // number of retries left

  // more state properties
  const [isGenerating, setIsGenerating] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState('');

  // function to take in an event, take that value, and set to our input state
  const onChange = (event) => {
    setInput(event.target.value);
  }

  // function to call when clicking generate button
  const generateAction = async() => {
    console.log('Generating...');

    // make sure there isn't a double click
    if (isGenerating && retry === 0) return;

    // set loading as started
    setIsGenerating(true);

    // if this is a retry request, take away retryCount
    if (retry > 0) {
      setRetryCount((prevState) => {
        if (prevState === 0) {
          return 0;
        } else {
          return prevState - 1;
        }
      });

      setRetry(0);
    }

    // replace somudro with unique identifier
    const finalInput = input.replace(/somudro/gi, 'sksks man')

    // fetch request
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: JSON.stringify({ input: finalInput }),
    });

    // convert response to json
    const data = await response.json();

    // model still loading
    if (response.status === 503) {
      console.log('Model is loading still :(.');
      // set the estimated_time property in state
      setRetry(data.estimated_time);
      return;
    }

    // another error
    if (!response.ok) {
      console.log('Error: ${data.error}');
      // stop loading
      setIsGenerating(false);
      return;
    }

    // if no errors, set final prompt, clear input box, set image data, and stop loading
    setFinalPrompt(input);
    setInput('');
    setImg(data.image);
    setIsGenerating(false);
  };

  const sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };

  useEffect(() => {
    const runRetry = async () => {
      if (retryCount === 0) {
        console.log(`Model still loading after ${maxRetries} retries. Try request again in 5 minutes.`);
        setRetryCount(maxRetries);
        return;
      }

      console.log(`Trying again in ${retry} seconds.`);

      await sleep(retry * 1000);

      await generateAction();
    };

    if (retry === 0) {
      return;
    }

    runRetry();

  }, [retry]);

  return (
    <div className="root">
      <Head>
        <title>Bad picture generator | buildspace</title>
      </Head>
      <div className="container">
        <div className="header">
          <div className="header-title">
            <h1>Make bad deepfakes!</h1>
          </div>
          <div className="header-subtitle">
            <h2>Make fake pictures and art of me (somudro)! (Example: "an ultrarealistic photo of somudro")</h2>
          </div>
          <div className="prompt-container">
            <input className="prompt-box" value={input} onChange={onChange} />
            <div className="prompt-buttons">
              <a className={isGenerating ? 'generate-button loading' : 'generate-button'} onClick={generateAction}>
                <div className="generate">
                  {isGenerating ? (
                    <span className="loader"></span>
                  ) : (
                    <p>Generate</p>
                  )}
                </div>
              </a>
            </div>
          </div>
        </div>
        {img && (
          <div className="output-content">
            <Image src={img} width={512} height={512} alt={input} />
            <p>{finalPrompt}</p>
          </div>
        )}
      </div>
      <div className="badge-container grow">
        <a
          href="https://buildspace.so/builds/ai-avatar"
          target="_blank"
          rel="noreferrer"
        >
          <div className="badge">
            <Image src={buildspaceLogo} alt="buildspace logo" />
            <p>build with buildspace</p>
          </div>
        </a>
      </div>
    </div>
  );
};

export default Home;