import { useState } from "react";
import axios from 'axios';
import {
  ChakraProvider,
  Box,
  Text,
  VStack,
  Input,
  Button,
  extendTheme,
  Textarea
} from "@chakra-ui/react";

// Update the theme to include custom colors.
const theme = extendTheme({
  colors: {
    brand: {
      900: "#1a202c",
    },
  },
});

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [file, setFile] = useState(null); // new state variable

  const handleFileChange = (event) => {
    setFile(event.target.files[0]); // just store the file in state
  };

  const handleUpload = () => {
    // make the API call when this function is called
    const formData = new FormData();
    formData.append('file', file);

    axios.post('http://localhost:8000/api/pdf/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then(response => {
      console.log(response.data.results);
      setAnswer(response.data.results)
    })
    .catch(error => {
      console.error("There was an error!", error);
    });
  };

  const handleQuestionChange = (event) => {
    setQuestion(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    axios.post('http://localhost:8000/api/answer/', {
      question: question
    })
    .then(response => {
      // The response data is assumed to be a JSON object with a key 'results'.
      // You might need to adjust this based on the actual structure of the response data.
      setAnswer(response.data.results);
    })
    .catch(error => {
      console.error("There was an error!", error);
    });
  };

  return (
    <ChakraProvider theme={theme}>
      <Box bg="brand.900" minH="100vh" >
        <VStack
          spacing={8}
          width="90%"
          maxW="800px"
          margin="auto"
          alignItems="stretch"
          color="white"
          p={8}
          borderRadius="md"
        >
          <Text fontSize="2xl" fontWeight="bold">
            Chat with a PDF File
          </Text>
          <Input type="file" accept=".pdf" onChange={handleFileChange} />
          <Button colorScheme="blue" onClick={handleUpload}>
            Upload PDF
          </Button>

          <form onSubmit={handleSubmit}>
            <Text fontWeight="bold">Question:</Text>
            <Input
              type="text"
              value={question}
              onChange={handleQuestionChange}
              size="md"
              mb={4}
            />
            <Button colorScheme="blue" type="submit" width="100%">
              Ask
            </Button>
          </form>

          <Box>
            <Text fontWeight="bold">Answer:</Text>
            <Textarea value={answer} resize="vertical" />
          </Box>
        </VStack>
      </Box>
    </ChakraProvider>
  );
}

export default App;
