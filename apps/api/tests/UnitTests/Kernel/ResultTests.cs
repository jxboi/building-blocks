using Kernel.Results;

namespace UnitTests.Kernel;

public sealed class ResultTests
{
    [Fact]
    public void Success_is_successful_and_carries_no_error()
    {
        var result = Result.Success();

        Assert.True(result.IsSuccess);
        Assert.False(result.IsFailure);
        Assert.Equal(Error.None, result.Error);
    }

    [Fact]
    public void Failure_carries_the_error()
    {
        var error = Error.NotFound("thing.missing", "Not here.");

        var result = Result.Failure(error);

        Assert.True(result.IsFailure);
        Assert.Equal(error, result.Error);
    }

    [Fact]
    public void Success_with_value_exposes_the_value()
    {
        var result = Result.Success(42);

        Assert.True(result.IsSuccess);
        Assert.Equal(42, result.Value);
    }

    [Fact]
    public void Accessing_value_on_failure_throws()
    {
        Result<int> result = Error.Failure("boom", "nope");

        Assert.Throws<InvalidOperationException>(() => result.Value);
    }

    [Fact]
    public void Value_implicitly_converts_to_success()
    {
        Result<string> result = "hello";

        Assert.True(result.IsSuccess);
        Assert.Equal("hello", result.Value);
    }

    [Fact]
    public void Error_implicitly_converts_to_failure()
    {
        var error = Error.Conflict("dup", "already exists");

        Result<string> result = error;

        Assert.True(result.IsFailure);
        Assert.Equal(error, result.Error);
    }

    [Fact]
    public void Success_cannot_carry_an_error()
    {
        Assert.Throws<InvalidOperationException>(() =>
            _ = new FakeResult(isSuccess: true, Error.Failure("x", "y")));
    }

    // Exercises the protected ctor invariant via a subclass in the test assembly.
    private sealed class FakeResult(bool isSuccess, Error error) : Result(isSuccess, error);
}
