import React, { useState, useEffect } from 'react';
import { Box, Button, Input, VStack, HStack, Text, Flex, IconButton } from '@chakra-ui/react';
import { FaPlus, FaSmile, FaFrown, FaMeh } from 'react-icons/fa';
import { client } from '../../lib/crud';

const Index = () => {
  const [demos, setDemos] = useState([]);
  const [newDemo, setNewDemo] = useState('');
  const [selectedDemo, setSelectedDemo] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackList, setFeedbackList] = useState([]);
  const [reactions, setReactions] = useState({ smile: 0, meh: 0, frown: 0 });

  useEffect(() => {
    // Fetch all demos from the database
    client.getWithPrefix('demo:').then(data => {
      setDemos(data.map(item => ({ id: item.key, headline: item.value.headline })));
    });
  }, []);

  const addDemo = () => {
    const demoId = `demo:${new Date().getTime()}`;
    client.set(demoId, { headline: newDemo }).then(() => {
      setDemos([...demos, { id: demoId, headline: newDemo }]);
      setNewDemo('');
    });
  };

  const selectDemo = (demo) => {
    setSelectedDemo(demo);
    // Fetch reactions and feedback for the selected demo
    client.getWithPrefix(`${demo.id}:reaction:`).then((data) => {
      if (data) {
        const aggregatedReactions = data.reduce(
          (acc, item) => {
            acc[item.value.type] += 1;
            return acc;
          },
          { smile: 0, meh: 0, frown: 0 }
        );
        setReactions(aggregatedReactions);
      } else {
        setReactions({ smile: 0, meh: 0, frown: 0 });
      }
    });
    client.getWithPrefix(`${demo.id}:feedback:`).then((data) => {
      if (data) {
        setFeedbackList(data.map((item) => item.value));
      } else {
        setFeedbackList([]);
      }
    });
  };

  const addReaction = (type) => {
    if (!selectedDemo) {
      console.error("No demo selected");
      return;
    }

    const reactionId = `${selectedDemo.id}:reaction:${new Date().getTime()}`;
    client.set(reactionId, { type })
      .then(() => {
        setReactions((prevReactions) => ({
          ...prevReactions,
          [type]: prevReactions[type] + 1,
        }));
      })
      .catch((error) => {
        console.error("Failed to add reaction:", error);
      });
  };

  const addFeedback = () => {
    const feedbackId = `${selectedDemo.id}:feedback:${new Date().getTime()}`;
    client.set(feedbackId, feedback).then(() => {
      setFeedbackList(prevFeedback => [...prevFeedback, feedback]);
      setFeedback('');
    });
  };

  return (
    <Box p={4}>
      <VStack spacing={4}>
        <HStack>
          <Input
            placeholder="Enter demo headline"
            value={newDemo}
            onChange={(e) => setNewDemo(e.target.value)}
          />
          <Button onClick={addDemo} leftIcon={<FaPlus />}>
            Create New Demo
          </Button>
        </HStack>
        <VStack spacing={2} align="stretch">
          {demos.map((demo) => (
            <Button key={demo.id} onClick={() => selectDemo(demo)}>
              {demo.headline}
            </Button>
          ))}
        </VStack>
        {selectedDemo && (
          <Box mt={4} p={4} borderWidth={1} borderRadius="md">
            <Text fontSize="xl" mb={4}>{selectedDemo.headline}</Text>
            <HStack spacing={4}>
              <IconButton icon={<FaSmile />} onClick={() => addReaction('smile')} />
              <Text>{reactions.smile}</Text>
              <IconButton icon={<FaMeh />} onClick={() => addReaction('meh')} />
              <Text>{reactions.meh}</Text>
              <IconButton icon={<FaFrown />} onClick={() => addReaction('frown')} />
              <Text>{reactions.frown}</Text>
            </HStack>
            <VStack mt={4} spacing={2} align="stretch">
              {feedbackList.map((fb, index) => (
                <Box key={index} p={2} borderWidth={1} borderRadius="md">
                  {fb}
                </Box>
              ))}
            </VStack>
            <HStack mt={4}>
              <Input
                placeholder="Enter feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <Button onClick={addFeedback}>Submit Feedback</Button>
            </HStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default Index;