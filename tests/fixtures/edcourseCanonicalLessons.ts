/**
 * The approved lesson descriptions for "System Design Mastery with Gaurav Sen",
 * Module 1, exactly as recorded in Succor's 4I.59 report (derived from the
 * lessons' YouTube transcripts). Titles and the module title are the stored
 * production values (2026-11-26).
 *
 * VERBATIM. Do not edit, reflow, summarize or "fix" punctuation: the tests pin
 * each description's SHA-256, so any change fails loudly instead of silently
 * testing different content.
 */

export const CANONICAL_COURSE_ID = "6a283d6bac931f6c1819adf9";
export const CANONICAL_MODULE_ID = "6a283d6bac931f6c1819adfb";
export const CANONICAL_MODULE_INDEX = 1;
export const CANONICAL_MODULE_TITLE = "Module 1: Introduction to System Design Concepts";

export const CANONICAL_LESSONS = [
  {
    id: "6a283d6bac931f6c1819adfd",
    lessonIndex: 1,
    title: "System Design Primer ⭐️: How to start with distributed systems?",
    sha256: "2ea087a2d950c7d641bbd274cc1f6bbd8ca79d0ba268f49c4167528c7455dfa3",
    description:
      "System design is the process of identifying engineering problems that arise as a system grows and choosing architectural solutions to address them. Using a pizza restaurant as a practical analogy, this lesson introduces the progression from a single resource to a scalable and distributed system. It explains vertical scaling as improving the capacity and throughput of an existing resource, and horizontal scaling as adding more resources of similar types to handle increased demand. It also introduces preprocessing through scheduled background work during non-peak periods, and redundancy through backup resources that reduce single points of failure. As the system grows, the lesson demonstrates how microservice architecture separates responsibilities into specialized teams or services that can be scaled independently. It then introduces distributed systems through multiple geographically separate locations that can serve nearby requests, improve response times, and provide greater fault tolerance, while also introducing the communication and routing complexity that comes with distribution. The lesson explains load balancing as intelligently directing incoming requests based on factors such as waiting time and total service time. It further explores decoupling by separating responsibilities between systems, logging and metrics as ways to record events and derive useful operational information, and extensibility as designing components so they can support changing business needs without requiring the entire system to be rewritten. Finally, it distinguishes high-level system design, which focuses on deployment and interactions between systems, from low-level system design, which focuses on implementation details such as classes, objects, functions, and signatures.",
  },
  {
    id: "6a283d6bac931f6c1819adfe",
    lessonIndex: 2,
    title: "System Design BASICS: Horizontal vs. Vertical Scaling",
    sha256: "960f4615be71e2e272660d1b72b0486af66494bb5368eaca246f011d7bc1e45f",
    description:
      "This lesson introduces the fundamentals of system design by explaining how software moves from running on a single computer to being hosted and scaled to serve many users. It begins with the relationship between an algorithm, an API, requests and responses, showing how a program can expose its functionality over the internet without distributing the computer running it. It then explains the limitations of self-hosting, including database configuration, endpoint management and service availability, and introduces cloud computing as access to remote computing resources whose configuration and reliability can largely be managed by a provider. As usage increases, the lesson defines scalability as the ability to handle more requests and presents two approaches: vertical scaling, which involves using a bigger machine to process requests faster, and horizontal scaling, which involves adding more machines and distributing requests among them. It compares the two approaches across five considerations: load balancing requirements, resilience and single points of failure, communication overhead, data consistency and hardware limitations. Vertical scaling benefits from faster interprocess communication and simpler data consistency within one system, but is limited by the maximum capacity of a machine and creates a single point of failure. Horizontal scaling can distribute requests across multiple machines, provide resilience when one machine fails and scale more effectively as users increase, but introduces network communication overhead and more complicated data consistency, particularly when transactions span multiple databases. The lesson explains that practical systems often combine both approaches by using reasonably powerful machines within a horizontally scaled architecture. It concludes by emphasizing that system design involves balancing scalability, resilience and consistency against the requirements and trade-offs of the system being built.",
  },
  {
    id: "6a283d6bac931f6c1819adff",
    lessonIndex: 3,
    title: "What is LOAD BALANCING? ⚖️",
    sha256: "0858197c2d4802b2e05f5d7edebf0ec1f5fdea587b7dbbac7e2c7eca07fca10a",
    description:
      "This lesson introduces load balancing and the motivation for consistent hashing through the problem of distributing incoming requests across multiple servers. It begins by explaining the server-client relationship, where a server runs an algorithm, receives requests from clients and returns responses. As the number of requests increases beyond what one computer can handle, additional servers can be introduced, creating the need to distribute incoming work across them. Load balancing is presented as the process of distributing requests across available servers to balance their workloads. The lesson demonstrates a basic hashing approach in which each request has an identifier that is passed through a hash function, and the resulting value is mapped to a server using modulo division by the number of available servers. With uniformly distributed request identifiers and hash values, this approach can distribute requests relatively evenly. However, adding another server changes the modulo operation and can cause many existing requests to be reassigned. The lesson illustrates this problem using four initial servers and the addition of a fifth, showing how a large portion of the previously assigned request space changes. This becomes especially problematic when request identifiers contain stable user information, such as a user ID, because the same user can consistently reach the same server and benefit from server-local caching. When servers are added and users are reassigned, previously useful cached information can become ineffective, reducing cache locality and introducing additional work. The lesson therefore establishes the motivation for consistent hashing: when the number of servers changes, request assignments should change as little as possible while still distributing the workload across available servers. It concludes by introducing consistent hashing as the approach intended to address this limitation of ordinary modulo-based hashing.",
  },
] as const;
